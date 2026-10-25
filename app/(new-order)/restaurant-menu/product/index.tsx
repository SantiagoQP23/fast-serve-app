import { ThemedText } from "@/presentation/theme/components/themed-text";
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
import BottomSheetPicker, {
  BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { Pressable, useWindowDimensions, View } from "react-native";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import NoteBottomSheet from "@/presentation/orders/components/note-bottom-sheet";
import Chip from "@/presentation/theme/components/chip";
import Card from "@/presentation/theme/components/card";
import { typography } from "@/constants/theme";

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 20;

const STOCK_TEXT_COLOR: Record<ProductOptionStockLevel, string> = {
  ok: "text-gray-500",
  low: "text-gray-700",
  out: "text-gray-700",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ThemedView style={tw`gap-2`}>
      {title ? <ThemedText type="small">{title}</ThemedText> : null}
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
  const typePickerRef = useRef<BottomSheetPickerRef>(null);
  const activeOrderDetail = useNewOrderStore((state) => state.activeDetail);
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
  const { counter, increment, decrement, setCounter } = useCounter(
    activeOrderDetail?.quantity ??
      (isReplaceMode ? replacingDetail?.quantity : undefined),
    1,
    MAX_QUANTITY,
    MIN_QUANTITY,
  );
  // What's typed in the quantity field while editing it; null shows the
  // quantity itself.
  const [quantityDraft, setQuantityDraft] = useState<string | null>(null);

  // Typed digits update the quantity right away, so adding while the
  // keyboard is still open uses what's on screen.
  const onChangeQuantityInput = (text: string) => {
    const digits = text.replace(/\D/g, "");
    setQuantityDraft(digits);
    const parsed = parseInt(digits, 10);
    if (Number.isNaN(parsed)) return;
    setCounter(Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, parsed)));
  };

  // Empty or out-of-range text snaps back to the quantity kept.
  const clearQuantityDraft = () => setQuantityDraft(null);
  const { activeProduct } = useMenuStore();
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

  const [price, setPrice] = useState(
    String(activeOrderDetail ? activeOrderDetail.price : selectedOption?.price),
  );

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
  // swipe down, system back).
  useEffect(() => {
    sheetRef.current?.present();
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

  const parsedCustomPrice = parseFloat(price);
  const effectivePrice = Number.isFinite(parsedCustomPrice)
    ? parsedCustomPrice
    : (selectedOption?.price ??
      getProductDefaultOption(activeProduct)?.price ??
      0);

  const selectableTags = getSelectableTags(activeProduct.tags);

  const newLine = () => ({
    quantity: counter,
    product: activeProduct,
    description: notes,
    price: effectivePrice,
    tagIds: selectedTagIds,
    productOption: selectedOption!,
    typeOrderDetail: typeOrderDetail || order?.type || orderType,
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
      },
      {},
    );
  };

  const requiresOptionSelection =
    isReplaceMode && activeOptions.length > 0 && !selectedOption;

  const replaceProductInOrder = () => {
    if (!order || !replacingDetail || requiresOptionSelection) return;

    replaceOrderDetail(
      {
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
        },
      },
      {
        onSuccess: () => {
          resetReplace();
          // Close the whole menu flow and land back on the order.
          exitsFlowRef.current = true;
          sheetRef.current?.dismiss();
        },
      },
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
              <ThemedText type="h3" accessibilityRole="header">
                {activeProduct.name}
              </ThemedText>
              {activeOptions.length === 1 && selectedOption && (
                <ThemedView
                  style={tw`flex-row items-center gap-3 flex-wrap bg-transparent`}
                >
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {selectedOption.name} ·{" "}
                    {formatCurrency(selectedOption.price)}
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
              {hasNote && (
                <Pressable
                  onPress={() => noteSheetRef.current?.present()}
                  accessibilityRole="button"
                  accessibilityLabel={`${t("menu:product.editNote")}: ${notes}`}
                  hitSlop={8}
                  style={({ pressed }) => [
                    tw`flex-row items-start gap-1.5 py-4`,
                    pressed && tw`opacity-60`,
                  ]}
                >
                  <ThemedText
                    type="body2"
                    numberOfLines={2}
                    style={tw`flex-1 `}
                  >
                    {notes}
                  </ThemedText>
                </Pressable>
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
                          isSelected && tw`bg-surface`,
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

            {selectableTags.length > 0 && (
              <Section title={""}>
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

            {/* The note and the line's settings read as one row of chips. */}
            {(!hasNote || !isSaleEditMode || isAdmin) && (
              <View style={tw`flex-row flex-wrap gap-2`}>
                {!hasNote && (
                  <Chip
                    variant="assist"
                    label={t("menu:product.addNote")}
                    icon="file-text"
                    onPress={() => noteSheetRef.current?.present()}
                  />
                )}
                {!isSaleEditMode && (
                  <Chip
                    variant="assist"
                    icon={
                      typeOrderDetail === OrderType.IN_PLACE
                        ? "utensils"
                        : "shopping-bag"
                    }
                    label={
                      typeOrderDetail === OrderType.IN_PLACE
                        ? t("common:orderType.inPlace")
                        : t("common:orderType.takeAway")
                    }
                    onPress={() => typePickerRef.current?.present()}
                  />
                )}
                {isAdmin && (
                  <Chip
                    variant="assist"
                    icon="circle-dollar-sign"
                    label={formatCurrency(effectivePrice)}
                    onPress={() => customPriceSheetRef.current?.present()}
                  />
                )}
              </View>
            )}
          </BottomSheetScrollView>

          <ThemedView style={tw`px-4 pt-3 gap-3`}>
            <ThemedView style={tw`flex-row items-center justify-center gap-3`}>
              <IconButton
                icon="minus"
                onPress={() => {
                  clearQuantityDraft();
                  decrement();
                }}
                variant="surface"
                size={28}
                style={tw`p-4`}
                disabled={counter <= 1}
                accessibilityLabel={t("menu:product.decrease")}
              />
              <TextInput
                variant="filled"
                inputMode="numeric"
                keyboardType="number-pad"
                returnKeyType="done"
                maxLength={2}
                selectTextOnFocus
                bottomSheet
                value={quantityDraft ?? String(counter)}
                onChangeText={onChangeQuantityInput}
                onBlur={clearQuantityDraft}
                onSubmitEditing={clearQuantityDraft}
                accessibilityLabel={t("menu:product.quantityValue", {
                  count: counter,
                })}
                containerStyle={tw`w-20 px-1 min-h-15`}
                style={[
                  tw`h-15 mt-0 text-center`,
                  { fontSize: 24, fontFamily: typography.bold },
                ]}
              />
              <IconButton
                icon="plus"
                onPress={() => {
                  clearQuantityDraft();
                  increment();
                }}
                variant="surface"
                size={28}
                style={tw`p-4`}
                disabled={atStockLimit}
                accessibilityLabel={t("menu:product.increase")}
              />
            </ThemedView>

            <Button
              label={`${addLabel} · ${formatCurrency(counter * effectivePrice)}`}
              onPress={onAddProduct}
              loading={isReplacing}
              disabled={
                isUnavailable ||
                blockedByStock ||
                isReplacing ||
                requiresOptionSelection ||
                (!selectedOption && !isReplaceMode)
              }
            />

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

      <BottomSheetPicker
        ref={typePickerRef}
        title={t("orders:newOrder.orderType")}
        options={[
          { label: t("common:orderType.inPlace"), value: OrderType.IN_PLACE },
          { label: t("common:orderType.takeAway"), value: OrderType.TAKE_AWAY },
        ]}
        value={typeOrderDetail}
        onChange={(value) => setTypeOrderDetail(value as OrderType)}
      />

      <ThemedBottomSheetModal ref={customPriceSheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
          <ThemedText type="h4">{t("orders:newOrder.customPrice")}</ThemedText>
          <TextInput
            label={t("menu:product.price")}
            value={price}
            onChangeText={setPrice}
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
