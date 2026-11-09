import { ThemedText } from "@/presentation/theme/components/themed-text";
import { toast } from "sonner-native";
import { getSelectableTags } from "@/core/menu/models/tag.model";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { router, useNavigation } from "expo-router";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
import { useCounter } from "@/presentation/shared/hooks/useCounter";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useMenuCart } from "@/presentation/restaurant-menu/hooks/useMenuCart";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { useEditOrderCartStore } from "@/presentation/orders/store/editOrderCartStore";
import {
  emitterAction,
  useRemovalAuthorization,
} from "@/presentation/orders/authorization/useRemovalAuthorization";
import { useReplaceOrderDetailStore } from "@/presentation/orders/store/replaceOrderDetailStore";
import { useEditSaleStore } from "@/presentation/orders/store/editSaleStore";
import { useOrders } from "@/presentation/orders/hooks/useOrders";
import { useRestaurantSettings } from "@/presentation/restaurant/hooks/useRestaurantSettings";
import { DEFAULT_ALLOW_ORDERS_WITHOUT_STOCK } from "@/core/restaurant/models/restaurant-settings.model";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import {
  getProductDefaultOption,
  ProductStatus,
} from "@/core/menu/models/product.model";
import {
  ProductOption,
  ProductOptionStockLevel,
  getProductOptionAvailableQuantity,
  getProductOptionStockLevel,
} from "@/core/menu/models/product-optionl.model";
import Icon from "@/presentation/theme/components/icon";
import {
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { Pressable, useWindowDimensions } from "react-native";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import NoteBottomSheet from "@/presentation/orders/components/note-bottom-sheet";
import QuantityStepper from "@/presentation/orders/components/quantity-stepper";
import ButtonGroup from "@/presentation/theme/components/button-group";
import Chip from "@/presentation/theme/components/chip";
import Card from "@/presentation/theme/components/card";
import { typography } from "@/constants/theme";
import {
  buildModifierRows,
  calculateUnitPrice,
  fitSelectionToVariant,
  EMPTY_SELECTION,
  getActiveGroups,
  getProductComponents,
  getSelectionProblem,
  selectionFromRows,
  toCustomizationPayload,
  type CustomizationSelection,
} from "@/core/menu/models/customization.model";
import CustomizationPicker from "@/presentation/restaurant-menu/components/customization-picker";

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 20;

const STOCK_TEXT_COLOR: Record<ProductOptionStockLevel, string> = {
  ok: "text-gray-500",
  low: "text-gray-700",
  out: "text-gray-700",
};

/**
 * The value, or the last non-null one it had. The store clears the active
 * product and line when this route unmounts; if that cleanup runs while the
 * route stays mounted (Fast Refresh), the open sheet must keep its product
 * rather than render nothing and strand the transparent route over the menu.
 */
function useLastNonNull<T>(value: T | null): T | null {
  const [last, setLast] = useState(value);
  if (value !== null && value !== last) setLast(value);
  return value ?? last;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ThemedView style={tw`gap-3`}>
      <ThemedText
        accessibilityRole="header"
        style={{ fontFamily: typography.bold }}
      >
        {title}
      </ThemedText>
      {children}
    </ThemedView>
  );
}

/**
 * Product picked from the menu, shown as a sheet over it: choose the variant,
 * extras, quantity and note, then add it. Also edits a line already in the
 * cart, and confirms the new product when replacing an order line.
 */
export default function ProductScreen() {
  const { t } = useTranslation(["menu", "orders", "common", "bills"]);
  const { height: windowHeight } = useWindowDimensions();
  const sheetRef = useRef<BottomSheetMethods>(null);
  // Set when the sheet should take the whole menu flow with it on close.
  const exitsFlowRef = useRef(false);
  const customPriceSheetRef = useRef<BottomSheetMethods>(null);
  const noteSheetRef = useRef<BottomSheetMethods>(null);
  const activeOrderDetail = useLastNonNull(
    useNewOrderStore((state) => state.activeDetail),
  );
  const orderType = useNewOrderStore((state) => state.orderType);

  const cart = useMenuCart();
  const { order } = cart;
  // While a direct sale is being edited, products go to that sale, never to
  // an order or the cart, whatever order is still marked active.
  const isSaleEditMode = cart.mode === "sale";
  const isReplaceMode = cart.mode === "replace";
  const isEditMode = cart.mode === "edit";
  const saleLines = useEditSaleStore((state) => state.lines);
  const replacingDetail = useReplaceOrderDetailStore((state) => state.detail);
  const resetReplace = useReplaceOrderDetailStore((state) => state.reset);
  const { counter, setCounter } = useCounter(
    activeOrderDetail?.quantity ??
      (isReplaceMode ? replacingDetail?.quantity : undefined),
    1,
    MAX_QUANTITY,
    MIN_QUANTITY,
  );
  const activeProduct = useLastNonNull(
    useMenuStore((state) => state.activeProduct),
  );
  const [notes, setNotes] = useState(activeOrderDetail?.description || "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    activeOrderDetail?.tagIds ?? [],
  );

  const activeOptions = useMemo(
    () => activeProduct?.options.filter((option) => option.isActive) ?? [],
    [activeProduct],
  );

  const setActiveProduct = useMenuStore((state) => state.setActiveProduct);
  const setActiveDetail = useNewOrderStore((state) => state.setActiveDetail);
  const updateDetail = useNewOrderStore((state) => state.updateDetail);
  const updateEditItem = useEditOrderCartStore((state) => state.updateNewItem);
  const cartDetails = useNewOrderStore((state) => state.details);
  const editNewItems = useEditOrderCartStore((state) => state.newItems);

  // Units of each option already sitting in the cart (excluding the line
  // being edited), so the stock shown is what's actually left to sell.
  const quantityInCartByOption = useMemo(() => {
    const lines = isSaleEditMode
      ? saleLines.filter((line) => !line.billDetailId)
      : isEditMode
        ? editNewItems
        : order
          ? []
          : cartDetails;
    const totals = new Map<number, number>();
    for (const line of lines) {
      if (!line.productOption) continue;
      if (
        activeOrderDetail?.id &&
        "id" in line &&
        line.id === activeOrderDetail.id
      )
        continue;
      const id = line.productOption.id;
      totals.set(id, (totals.get(id) ?? 0) + line.quantity);
    }
    return totals;
  }, [
    isSaleEditMode,
    saleLines,
    isEditMode,
    editNewItems,
    order,
    cartDetails,
    activeOrderDetail,
  ]);

  // Replacing a line gives its units back before taking the new ones.
  const quantityReturnedByOption = (option: ProductOption) =>
    isReplaceMode && replacingDetail?.productOption?.id === option.id
      ? replacingDetail.quantity
      : 0;

  const getOptionStock = (option: ProductOption) => {
    const available = getProductOptionAvailableQuantity(option);
    if (available === null) return null;
    const remaining = Math.max(
      available -
        (quantityInCartByOption.get(option.id) ?? 0) +
        quantityReturnedByOption(option),
      0,
    );
    return {
      remaining,
      level: getProductOptionStockLevel(option, remaining)!,
    };
  };

  // Open on a variant that can actually be sold: the default one if it has
  // stock left, otherwise the first one that does.
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(
    () => {
      if (activeOrderDetail) return activeOrderDetail.productOption;
      const hasStock = (option: ProductOption) => {
        const stock = getOptionStock(option);
        return !stock || stock.remaining > 0;
      };
      const defaultOption = activeOptions.find((option) => option.isDefault);
      if (defaultOption && hasStock(defaultOption)) return defaultOption;
      return (
        activeOptions.find(hasStock) ??
        defaultOption ??
        activeOptions[0] ??
        null
      );
    },
  );

  // What the waiter picked: options of the product's groups and the
  // included items taken off. Editing a cart line starts from its picks.
  const [selection, setSelection] = useState<CustomizationSelection>(
    () =>
      activeOrderDetail?.customization ??
      (activeOrderDetail?.modifiers
        ? selectionFromRows(activeOrderDetail.modifiers)
        : EMPTY_SELECTION),
  );

  const [price, setPrice] = useState(
    String(activeOrderDetail ? activeOrderDetail.price : selectedOption?.price),
  );
  // Only a price typed by hand replaces the calculated one.
  const [priceTyped, setPriceTyped] = useState(() => {
    if (!activeOrderDetail) return false;
    if (activeOrderDetail.customPrice !== undefined)
      return activeOrderDetail.customPrice;
    return (
      activeOrderDetail.price !== undefined &&
      !!activeOrderDetail.productOption &&
      Number(activeOrderDetail.price) !==
        calculateUnitPrice(
          activeOrderDetail.productOption.price,
          activeOrderDetail.modifiers,
        )
    );
  });

  const navigation = useNavigation();
  const { user } = useAuthStore();
  const isAdmin = isAdminLevelRole(user?.role?.name);

  const [typeOrderDetail, setTypeOrderDetail] = useState<OrderType>(
    activeOrderDetail
      ? activeOrderDetail.typeOrderDetail
      : isReplaceMode && replacingDetail
        ? replacingDetail.typeOrderDetail
        : order
          ? order.type
          : orderType,
  );

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const { settings } = useRestaurantSettings();
  // With the setting off, the server rejects anything beyond the stock left,
  // so don't let the waiter ask for it.
  const blocksWithoutStock =
    (settings?.ALLOW_ORDERS_WITHOUT_STOCK ??
      DEFAULT_ALLOW_ORDERS_WITHOUT_STOCK) === false;

  const { mutate: addOrderDetailToOrder } = useOrders().addOrderDetailToOrder;
  const { isLoading: isReplacing, mutate: replaceOrderDetail } =
    useOrders().replaceOrderDetail;
  const { authorize } = useRemovalAuthorization();

  // However the sheet closes (button, scrim, system back), the product and
  // the line being edited stop being active.
  useEffect(
    () => () => {
      setActiveProduct(null);
      setActiveDetail(null);
    },
    [setActiveProduct, setActiveDetail],
  );

  // The route is just a host for the native sheet: open it on arrival, and
  // pop the route once it has closed, however it closed (button, scrim,
  // swipe down, system back). Arriving with no product (a restored or
  // stale route), leave at once: an empty transparent screen would sit
  // invisibly over the menu and swallow every tap.
  useEffect(() => {
    if (activeProduct) sheetRef.current?.present();
    else router.back();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToMenu = () => sheetRef.current?.dismiss();

  const handleSheetDismissed = () => {
    if (exitsFlowRef.current) navigation.getParent()?.goBack();
    else router.back();
  };

  if (!activeProduct) {
    return null;
  }

  const isUnavailable = activeProduct.status !== ProductStatus.AVAILABLE;

  const statusLabelColor =
    activeProduct.status === ProductStatus.OUT_OF_STOCK ? "default" : "warning";

  const selectedStock = selectedOption ? getOptionStock(selectedOption) : null;
  const exceedsStock = !!selectedStock && counter > selectedStock.remaining;
  const blockedByStock = blocksWithoutStock && exceedsStock;
  const atStockLimit =
    blocksWithoutStock && !!selectedStock && counter >= selectedStock.remaining;

  const groups = getActiveGroups(activeProduct);
  const components = getProductComponents(activeProduct);
  // Products with groups or included items always send their selection, so
  // the server prices it and spends the right insumos.
  const isCustomizable = groups.length > 0 || components.length > 0;
  // The selected variant's own rules apply (plans/limites-por-variante.md).
  const variantId = selectedOption?.id;
  const modifierRows = isCustomizable
    ? buildModifierRows(activeProduct, selection, variantId)
    : [];
  const selectionProblem = isCustomizable
    ? getSelectionProblem(activeProduct, selection, variantId)
    : null;

  const basePrice =
    selectedOption?.price ?? getProductDefaultOption(activeProduct)?.price ?? 0;
  const parsedCustomPrice = parseFloat(price);
  const effectivePrice =
    priceTyped && Number.isFinite(parsedCustomPrice)
      ? parsedCustomPrice
      : calculateUnitPrice(basePrice, modifierRows);
  const customPrice = priceTyped && Number.isFinite(parsedCustomPrice);

  const lineCustomization = isCustomizable
    ? {
        customization: selection,
        modifiers: modifierRows,
        customPrice,
      }
    : {};
  const customizationPayload = isCustomizable
    ? toCustomizationPayload(selection, modifierRows, customPrice)
    : undefined;



  const selectableTags = getSelectableTags(activeProduct.tags);

  const newLine = () => ({
    quantity: counter,
    product: activeProduct,
    description: notes,
    price: effectivePrice,
    tagIds: selectedTagIds,
    productOption: selectedOption!,
    typeOrderDetail: typeOrderDetail || order?.type || orderType,
    ...lineCustomization,
  });

  const addProductToOrder = () => {
    if (!order) return;
    addOrderDetailToOrder(
      {
        productId: activeProduct.id,
        quantity: counter,
        price: effectivePrice,
        description: notes,
        orderId: order.id,
        tagIds: selectedTagIds,
        productOptionId: selectedOption!.id,
        typeOrderDetail: typeOrderDetail || order.type,
        ...(customizationPayload && { customization: customizationPayload }),
      },
      {},
    );
  };

  const requiresOptionSelection =
    isReplaceMode && activeOptions.length > 0 && !selectedOption;

  const replaceProductInOrder = () => {
    if (!order || !replacingDetail || requiresOptionSelection) return;

    const payload = {
      orderId: order.id,
      detailId: replacingDetail.id,
      newDetail: {
        productId: activeProduct.id,
        quantity: counter,
        price: effectivePrice,
        description: notes,
        tagIds: selectedTagIds,
        productOptionId: selectedOption?.id,
        typeOrderDetail: typeOrderDetail || order.type,
        ...(customizationPayload && { customization: customizationPayload }),
      },
    };

    // Taking the old item off may need an owner/admin code.
    void authorize(
      t("orders:authorization.summaryReplace", {
        from: replacingDetail.product.name,
        to: activeProduct.name,
      }),
      emitterAction(
        replaceOrderDetail,
        (code) => ({ ...payload, ...(code && { authorizationCode: code }) }),
        () => {
          resetReplace();
          // Close the whole menu flow and land back on the order.
          exitsFlowRef.current = true;
          sheetRef.current?.dismiss();
        },
      ),
    );
  };

  const onAddProduct = () => {
    if (isReplaceMode) {
      replaceProductInOrder();
      return;
    }

    if (activeOrderDetail?.id && isEditMode) {
      updateEditItem(activeOrderDetail.id, newLine());
    } else if (activeOrderDetail?.id && cart.mode === "cart") {
      updateDetail({ ...newLine(), id: activeOrderDetail.id });
    } else if (cart.mode === "order") {
      addProductToOrder();
    } else {
      cart.addLine(newLine());
    }
    goToMenu();
  };

  const onChangeSelectedOption = (option: ProductOption) => {
    setSelectedOption(option);
    setPrice(String(option.price));
    setPriceTyped(false);
    // Picks carry over as far as the new variant's rules allow.
    const fitted = fitSelectionToVariant(activeProduct, selection, option.id);
    setSelection(fitted.selection);
    if (fitted.dropped.length)
      toast(
        t("menu:customization.droppedForVariant", {
          names: fitted.dropped.join(", "),
          variant: option.name,
        }),
      );
  };

  const addLabel = isReplaceMode
    ? t("orders:replaceItem.confirm")
    : activeOrderDetail?.id
      ? t("common:actions.update")
      : t("common:actions.add");

  const hasNote = notes.trim() !== "";

  return (
    <>
      <ThemedBottomSheetModal
        ref={sheetRef}
        enablePanDownToClose
        onDismiss={handleSheetDismissed}
      >
        <BottomSheetView style={tw`pb-6`}>
          <ThemedView style={tw`px-4 pt-2 pb-2 bg-transparent`}>
            <ThemedView style={tw`gap-1 pt-1 bg-transparent`}>
              <ThemedView style={tw`flex-row items-start gap-2 bg-transparent`}>
                <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                  <ThemedText type="h3" accessibilityRole="header">
                    {activeProduct.name}
                  </ThemedText>
                  {activeOptions.length === 1 && selectedOption && (
                    <ThemedView
                      style={tw`flex-row items-center gap-3 flex-wrap bg-transparent`}
                    >
                      <ThemedText type="body2" style={tw`text-gray-500`}>
                        {formatCurrency(effectivePrice)}
                      </ThemedText>
                      {/* Products with variants show stock on each variant instead. */}
                      {selectedStock && (
                        <Label
                          size="small"
                          leftIcon="package"
                          color="default"
                          text={
                            selectedStock.level === "out"
                              ? t("menu:product.stock.out")
                              : t("menu:product.stock.left", {
                                  count: selectedStock.remaining,
                                })
                          }
                        />
                      )}
                    </ThemedView>
                  )}
                </ThemedView>
                {isAdmin && (
                  <IconButton
                    icon="pencil"
                    variant="surface"
                    size={20}
                    onPress={() => customPriceSheetRef.current?.present()}
                    accessibilityLabel={t("orders:detailActions.customPrice")}
                  />
                )}
              </ThemedView>
              {/* The note itself, or "Add note" when there is none: tap to edit. */}
              <Pressable
                onPress={() => noteSheetRef.current?.present()}
                accessibilityRole="button"
                accessibilityLabel={
                  hasNote
                    ? `${t("menu:product.editNote")}: ${notes}`
                    : t("orders:newOrder.addNote")
                }
                style={({ pressed }) => [
                  tw`self-start py-3 min-h-12 justify-center`,
                  hasNote && tw`self-stretch`,
                  pressed && tw`opacity-60`,
                ]}
              >
                <ThemedText
                  type="body2"
                  numberOfLines={hasNote ? 3 : 1}
                  style={!hasNote && tw`text-gray-500`}
                >
                  {hasNote ? notes : `${t("orders:newOrder.addNote")}...`}
                </ThemedText>
              </Pressable>
              {/* Hugs its content; the order type is a quick toggle. */}
              {!isSaleEditMode && (
                <ThemedView style={tw`flex-row bg-transparent`}>
                  <ButtonGroup
                    options={[
                      {
                        label: t("common:orderType.inPlace"),
                        value: OrderType.IN_PLACE,
                        icon: "utensils",
                      },
                      {
                        label: t("common:orderType.takeAway"),
                        value: OrderType.TAKE_AWAY,
                        icon: "shopping-bag",
                      },
                    ]}
                    size="small"
                    selected={typeOrderDetail}
                    onChange={(value: OrderType) => setTypeOrderDetail(value)}
                  />
                </ThemedView>
              )}
            </ThemedView>
          </ThemedView>

          <BottomSheetScrollView
            style={{ maxHeight: windowHeight * 0.6 }}
            contentContainerStyle={tw`px-4 pt-3 pb-2 gap-6`}
            showsVerticalScrollIndicator={false}
          >
            {activeProduct.description ? (
              <ThemedText type="body2" style={tw`text-gray-600`}>
                {activeProduct.description}
              </ThemedText>
            ) : null}

            {isUnavailable && (
              <ThemedView style={tw`flex-row`}>
                <Label
                  text={t(`menu:product.status.${activeProduct.status}`)}
                  color={statusLabelColor}
                />
              </ThemedView>
            )}

            {activeOptions.length > 1 && (
              <Section title={t("menu:variants")}>
                <ThemedView
                  accessibilityRole="radiogroup"
                  style={[
                    tw`flex-row flex-wrap justify-between`,
                    { rowGap: 8 },
                  ]}
                >
                  {activeOptions.map((option) => {
                    const isSelected = selectedOption?.id === option.id;
                    const optionStock = getOptionStock(option);
                    const stockText = optionStock
                      ? optionStock.level === "out"
                        ? t("menu:product.stock.out")
                        : t("menu:product.stock.left", {
                            count: optionStock.remaining,
                          })
                      : null;
                    return (
                      <Card
                        key={option.id}
                        variant="outline"
                        onPress={() => onChangeSelectedOption(option)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                        accessibilityLabel={[
                          option.name,
                          formatCurrency(option.price),
                          stockText,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                        containerStyle={[
                          { width: "48.5%" },
                          isSelected && tw`bg-secondary`,
                        ]}
                        style={tw`px-4 py-3 gap-1 min-h-16 justify-center`}
                      >
                        <ThemedView
                          style={tw`flex-row items-center gap-2 bg-transparent`}
                        >
                          <ThemedText
                            style={tw`flex-1 ${isSelected ? "text-on-secondary" : ""}`}
                          >
                            {option.name}
                          </ThemedText>
                        </ThemedView>
                        <ThemedView
                          style={tw`flex-row items-center justify-between gap-2 bg-transparent`}
                        >
                          <ThemedText
                            type="body2"
                            style={tw`${isSelected ? "text-on-secondary" : ""}`}
                          >
                            {formatCurrency(option.price)}
                          </ThemedText>
                          {optionStock && (
                            <ThemedText
                              type="small"
                              style={[
                                tw`${STOCK_TEXT_COLOR[optionStock.level]}`,
                                // Low and out of stock read by weight, not by color.
                                optionStock.level !== "ok" && {
                                  fontFamily: typography.bold,
                                },
                              ]}
                            >
                              {stockText}
                            </ThemedText>
                          )}
                        </ThemedView>
                      </Card>
                    );
                  })}
                </ThemedView>
              </Section>
            )}

            {isCustomizable && (
              <CustomizationPicker
                product={activeProduct}
                variantId={variantId}
                selection={selection}
                onChange={setSelection}
                blocksWithoutStock={blocksWithoutStock}
              />
            )}

            {selectableTags.length > 0 && (
              <Section title={t("menu:product.customize")}>
                <ThemedView style={tw`flex-row flex-wrap gap-2`}>
                  {selectableTags.map((tag) => (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      selected={selectedTagIds.includes(tag.id)}
                      onPress={() => toggleTag(tag.id)}
                    />
                  ))}
                </ThemedView>
              </Section>
            )}
          </BottomSheetScrollView>

          <ThemedView style={tw`px-4 pt-3 gap-3`}>
            <QuantityStepper
              value={counter}
              onChange={setCounter}
              min={MIN_QUANTITY}
              max={MAX_QUANTITY}
              incrementDisabled={atStockLimit}
              bottomSheet
            />

            <Button
              label={`${addLabel} · ${formatCurrency(counter * effectivePrice)}`}
              onPress={onAddProduct}
              loading={isReplacing}
              disabled={
                isUnavailable ||
                blockedByStock ||
                isReplacing ||
                requiresOptionSelection ||
                !!selectionProblem ||
                (!selectedOption && !isReplaceMode)
              }
            />

            {selectionProblem && (
              <ThemedText type="small" style={tw`text-gray-600`}>
                {t("menu:customization.pickToContinue", {
                  count: selectionProblem.min,
                  group: selectionProblem.groupName,
                })}
              </ThemedText>
            )}

            {exceedsStock && (
              <ThemedView style={tw`flex-row items-center gap-1.5`}>
                <Icon
                  name="circle-alert"
                  size={16}
                  color={tw.color("orange-700")}
                />
                <ThemedText type="small" style={tw`text-orange-700`}>
                  {selectedStock!.remaining === 0
                    ? t("menu:product.stock.noneLeft")
                    : t("menu:product.stock.exceeds", {
                        count: selectedStock!.remaining,
                      })}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </BottomSheetView>
      </ThemedBottomSheetModal>

      <ThemedBottomSheetModal ref={customPriceSheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
          <ThemedText type="h4">{t("orders:newOrder.customPrice")}</ThemedText>
          <TextInput
            label={t("menu:product.price")}
            value={price}
            onChangeText={(value) => {
              setPrice(value);
              setPriceTyped(true);
            }}
            keyboardType="decimal-pad"
            bottomSheet
          />

          <Button
            label={t("common:actions.done")}
            onPress={() => customPriceSheetRef.current?.dismiss()}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>

      <NoteBottomSheet
        ref={noteSheetRef}
        initialValue={notes}
        onSave={(note) => {
          setNotes(note.trim());
          noteSheetRef.current?.dismiss();
        }}
        placeholder={t("orders:newOrder.addNote")}
      />
    </>
  );
}
