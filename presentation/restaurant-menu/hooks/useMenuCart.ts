import { useMemo } from "react";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { Product, ProductStatus } from "@/core/menu/models/product.model";
import { getProductOptionAvailableQuantity } from "@/core/menu/models/product-optionl.model";
import { NewOrderDetail } from "@/core/orders/dto/new-order-detail.dto";
import { DEFAULT_ALLOW_ORDERS_WITHOUT_STOCK } from "@/core/restaurant/models/restaurant-settings.model";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useEditOrderCartStore } from "@/presentation/orders/store/editOrderCartStore";
import { useReplaceOrderDetailStore } from "@/presentation/orders/store/replaceOrderDetailStore";
import { useEditSaleStore } from "@/presentation/orders/store/editSaleStore";
import { useRestaurantSettings } from "@/presentation/restaurant/hooks/useRestaurantSettings";

/**
 * Where products picked from the menu go:
 * - `cart`: the new-order cart.
 * - `edit`: new items for the active order, reviewed in the cart.
 * - `sale`: new lines for the direct sale being edited.
 * - `replace`: swapping one line of the active order (confirmed on the
 *   product screen, never added in one tap).
 * - `order`: straight to the active order on the server (product screen only).
 */
export type MenuCartMode = "cart" | "edit" | "sale" | "replace" | "order";

type NewLine = Omit<NewOrderDetail, "id">;

const ADDED_TOAST_ID = "menu-line-added";

/**
 * The lines the menu is currently adding to, whichever store holds them, plus
 * one way to add to them that merges identical lines and offers an undo.
 */
export function useMenuCart() {
  const { t } = useTranslation(["menu", "common"]);

  const isSaleEditMode = useEditSaleStore((state) => state.billId !== null);
  const saleLines = useEditSaleStore((state) => state.lines);
  const activeOrder = useOrdersStore((state) => state.activeOrder);
  const order = isSaleEditMode ? null : activeOrder;
  const editOrderId = useEditOrderCartStore((state) => state.orderId);
  const editNewItems = useEditOrderCartStore((state) => state.newItems);
  const replaceOrderId = useReplaceOrderDetailStore((state) => state.orderId);
  const replacingDetail = useReplaceOrderDetailStore((state) => state.detail);
  const cartDetails = useNewOrderStore((state) => state.details);
  const cartOrderType = useNewOrderStore((state) => state.orderType);

  const { settings } = useRestaurantSettings();
  // With the setting off, the server rejects anything beyond the stock left.
  const blocksWithoutStock =
    (settings?.ALLOW_ORDERS_WITHOUT_STOCK ??
      DEFAULT_ALLOW_ORDERS_WITHOUT_STOCK) === false;

  const mode: MenuCartMode = isSaleEditMode
    ? "sale"
    : !order
      ? "cart"
      : replacingDetail && replaceOrderId === order.id
        ? "replace"
        : editOrderId === order.id
          ? "edit"
          : "order";

  const lines = useMemo(() => {
    if (mode === "sale")
      return saleLines
        .filter((line) => !line.billDetailId)
        .map((line) => ({
          productId: line.product?.id,
          optionId: line.productOption?.id,
          quantity: line.quantity,
          price: line.price,
        }));
    const details =
      mode === "edit" ? editNewItems : mode === "cart" ? cartDetails : [];
    return details.map((detail) => ({
      productId: detail.product.id,
      optionId: detail.productOption?.id,
      quantity: detail.quantity,
      price: detail.price ?? detail.productOption?.price ?? 0,
    }));
  }, [mode, saleLines, editNewItems, cartDetails]);

  const summary = useMemo(() => {
    const countByProduct = new Map<string, number>();
    const countByOption = new Map<number, number>();
    let count = 0;
    let total = 0;
    for (const line of lines) {
      count += line.quantity;
      total += line.price * line.quantity;
      if (line.productId)
        countByProduct.set(
          line.productId,
          (countByProduct.get(line.productId) ?? 0) + line.quantity,
        );
      if (line.optionId != null)
        countByOption.set(
          line.optionId,
          (countByOption.get(line.optionId) ?? 0) + line.quantity,
        );
    }
    return { count, total, countByProduct, countByOption };
  }, [lines]);

  /** Order type a new line starts with. */
  const defaultOrderType = order ? order.type : cartOrderType;

  /** Adds a line to the current target. Returns how to take it back out. */
  const insertLine = (line: NewLine): (() => void) | null => {
    if (mode === "sale") {
      const sale = useEditSaleStore.getState();
      sale.addLine({
        product: line.product,
        productOption: line.productOption,
        price: line.price ?? line.productOption.price,
        quantity: line.quantity,
      });
      const added = useEditSaleStore
        .getState()
        .lines.find(
          (l) =>
            !l.billDetailId &&
            l.productOption?.id === line.productOption.id &&
            l.price === (line.price ?? line.productOption.price),
        );
      if (!added) return null;
      return () => {
        const { lines, setQuantity, removeLine } = useEditSaleStore.getState();
        const current = lines.find((l) => l.key === added.key);
        if (!current) return;
        if (current.quantity > line.quantity)
          setQuantity(current.key, current.quantity - line.quantity);
        else removeLine(current.key);
      };
    }

    if (mode === "edit") {
      const id = useEditOrderCartStore.getState().addNewItem(line);
      return () => {
        const { newItems, updateNewItem, removeNewItem } =
          useEditOrderCartStore.getState();
        const current = newItems.find((item) => item.id === id);
        if (!current) return;
        if (current.quantity > line.quantity)
          updateNewItem(id, { quantity: current.quantity - line.quantity });
        else removeNewItem(id);
      };
    }

    if (mode === "cart") {
      const id = useNewOrderStore.getState().addDetail(line);
      return () => {
        const { details, updateDetail, removeDetail } =
          useNewOrderStore.getState();
        const current = details.find((detail) => detail.id === id);
        if (!current) return;
        if (current.quantity > line.quantity)
          updateDetail({
            ...current,
            quantity: current.quantity - line.quantity,
          });
        else removeDetail(current);
      };
    }

    return null;
  };

  /**
   * Adds the line and confirms it with a haptic tick and an undo toast.
   * Returns false when the current mode doesn't take lines this way.
   */
  const addLine = (line: NewLine) => {
    const undo = insertLine(line);
    if (!undo) return false;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const showsVariant =
      line.product.options.filter((option) => option.isActive).length > 1;
    const name = showsVariant
      ? `${line.product.name} ${line.productOption.name}`
      : line.product.name;
    // One toast that each add replaces, so its undo is always the last add.
    toast.success(
      t("menu:lineAdded", {
        item: line.quantity > 1 ? `${line.quantity} × ${name}` : name,
      }),
      {
        id: ADDED_TOAST_ID,
        duration: 5000,
        action: {
          label: t("common:actions.undo"),
          onClick: () => {
            undo();
            toast.dismiss(ADDED_TOAST_ID);
          },
        },
      },
    );
    return true;
  };

  /**
   * The variant one tap would add, for products with nothing to choose: a
   * single variant, available, and stock left if the restaurant blocks
   * overselling. Null when the product needs its detail screen instead.
   */
  const getQuickAddOption = (product: Product) => {
    if (mode !== "cart" && mode !== "edit" && mode !== "sale") return null;
    if (product.status !== ProductStatus.AVAILABLE) return null;

    const activeOptions = product.options.filter((option) => option.isActive);
    if (activeOptions.length !== 1) return null;
    const option = activeOptions[0];

    const available = getProductOptionAvailableQuantity(option);
    const inCart = summary.countByOption.get(option.id) ?? 0;
    // Let the product screen explain why no more can be ordered.
    if (blocksWithoutStock && available !== null && inCart + 1 > available)
      return null;

    return option;
  };

  /** Adds one unit in one tap. Returns false when the product needs its screen. */
  const quickAdd = (product: Product) => {
    const option = getQuickAddOption(product);
    if (!option) return false;

    return addLine({
      product,
      productOption: option,
      quantity: 1,
      price: option.price,
      description: "",
      tagIds: [],
      typeOrderDetail: defaultOrderType,
    });
  };

  /**
   * Lines of this product that the product screen can edit in place: cart
   * and edit-order lines. Sale lines aren't edited from the menu.
   */
  const editableLines = (productId: string): NewOrderDetail[] =>
    (mode === "edit" ? editNewItems : mode === "cart" ? cartDetails : []).filter(
      (detail) => detail.product.id === productId,
    );

  return {
    mode,
    order,
    count: summary.count,
    total: summary.total,
    countByProduct: summary.countByProduct,
    defaultOrderType,
    addLine,
    canQuickAdd: (product: Product) => getQuickAddOption(product) !== null,
    quickAdd,
    editableLines,
  };
}
