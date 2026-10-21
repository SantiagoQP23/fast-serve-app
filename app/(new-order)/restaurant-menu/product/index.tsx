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
import OptionRow from "@/presentation/theme/components/option-row";
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
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import BottomSheetPicker, {
  BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import NoteBottomSheet from "@/presentation/orders/components/note-bottom-sheet";
import Chip from "@/presentation/theme/components/chip";

/** Material caps sheets at 640dp on large screens. */
const SHEET_MAX_WIDTH = 640;

const STOCK_LABEL_COLOR: Record<
  ProductOptionStockLevel,
  "default" | "warning" | "error"
> = {
  ok: "default",
  low: "warning",
  out: "error",
};

const STOCK_TEXT_COLOR: Record<ProductOptionStockLevel, string> = {
  ok: "text-gray-500",
  low: "text-orange-700",
  out: "text-red-700",
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
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  // Slide in with a transform: a layout-based entering animation pins the
  // sheet to its first measured top, so content that grows a frame later
  // (e.g. many variants) pushed the footer off-screen.
  const sheetOffset = useSharedValue(windowHeight);
  useEffect(() => {
    sheetOffset.value = withTiming(0, {
      duration: 320,
      easing: Easing.out(Easing.exp),
    });
  }, [sheetOffset]);
  const sheetSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetOffset.value }],
  }));
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
  const { counter, increment, decrement } = useCounter(
    activeOrderDetail?.quantity ??
      (isReplaceMode ? replacingDetail?.quantity : undefined),
    1,
    20,
    1,
  );
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

  const goToMenu = () => router.back();

  if (!activeProduct) {
    return null;
  }

  const isUnavailable = activeProduct.status !== ProductStatus.AVAILABLE;

  const statusLabelColor =
    activeProduct.status === ProductStatus.OUT_OF_STOCK ? "error" : "warning";

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
          navigation.getParent()?.goBack();
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
      <View style={tw`flex-1 justify-end`}>
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[StyleSheet.absoluteFill, tw`bg-black/40`]}
        >
          <Pressable
            style={tw`flex-1`}
            onPress={goToMenu}
            accessibilityRole="button"
            accessibilityLabel={t("common:actions.close")}
          />
        </Animated.View>

        <Animated.View
          style={[
            sheetSlideStyle,
            tw`bg-background rounded-t-3xl w-full self-center`,
            {
              maxWidth: SHEET_MAX_WIDTH,
              maxHeight: "92%",
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <ThemedView
            style={tw`flex-row items-start gap-2 pl-4 pr-2 pt-4 pb-2 bg-transparent`}
          >
            <ThemedView style={tw`flex-1 gap-1 pt-1 bg-transparent`}>
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
                  {selectedStock && selectedStock.level !== "ok" && (
                    <Label
                      size="small"
                      leftIcon="package"
                      color={STOCK_LABEL_COLOR[selectedStock.level]}
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
            <IconButton
              icon="x"
              size={22}
              onPress={goToMenu}
              accessibilityLabel={t("common:actions.close")}
            />
          </ThemedView>

          <ScrollView
            style={tw`flex-shrink`}
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
                      <Pressable
                        key={option.id}
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
                        style={({ pressed }) => [
                          tw`rounded-md px-4 py-3 gap-1 min-h-16 justify-center`,
                          { width: "48.5%" },
                          isSelected
                            ? tw`bg-surface border border-primary`
                            : tw`border border-primary`,
                          pressed && tw`opacity-75`,
                        ]}
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
                          {optionStock && optionStock.level !== "ok" && (
                            <ThemedText
                              type="small"
                              style={tw`${STOCK_TEXT_COLOR[optionStock.level]}`}
                            >
                              {stockText}
                            </ThemedText>
                          )}
                        </ThemedView>
                      </Pressable>
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

            {/* Note chip and the line's settings read as one group. */}
            <View style={tw`gap-2`}>
              {!hasNote && (
                <ThemedView style={tw`flex-row`}>
                  <Chip
                    variant="assist"
                    label={t("menu:product.addNote")}
                    icon="file-text"
                    onPress={() => noteSheetRef.current?.present()}
                  />
                </ThemedView>
              )}

              <View>
                {!isSaleEditMode && (
                  <OptionRow
                    icon={
                      typeOrderDetail === OrderType.IN_PLACE
                        ? "utensils"
                        : "shopping-bag"
                    }
                    label={t("menu:product.serve")}
                    value={
                      typeOrderDetail === OrderType.IN_PLACE
                        ? t("common:orderType.inPlace")
                        : t("common:orderType.takeAway")
                    }
                    onPress={() => typePickerRef.current?.present()}
                  />
                )}
                {isAdmin && (
                  <OptionRow
                    icon="circle-dollar-sign"
                    label={t("menu:product.price")}
                    value={formatCurrency(effectivePrice)}
                    onPress={() => customPriceSheetRef.current?.present()}
                  />
                )}
              </View>
            </View>
          </ScrollView>

          <ThemedView style={tw`px-4 pt-3 gap-2 `}>
            <ThemedView style={tw`flex-row items-center gap-3`}>
              <ThemedView style={tw`flex-row items-center gap-1`}>
                <IconButton
                  icon="minus"
                  onPress={decrement}
                  variant="surface"
                  size={22}
                  disabled={counter <= 1}
                  accessibilityLabel={t("menu:product.decrease")}
                />
                <ThemedText
                  type="h4"
                  style={tw`min-w-8 text-center`}
                  accessibilityLiveRegion="polite"
                  accessibilityLabel={t("menu:product.quantityValue", {
                    count: counter,
                  })}
                >
                  {counter}
                </ThemedText>
                <IconButton
                  icon="plus"
                  onPress={increment}
                  variant="surface"
                  size={22}
                  disabled={atStockLimit}
                  accessibilityLabel={t("menu:product.increase")}
                />
              </ThemedView>
              <Button
                style={tw`flex-1`}
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
            </ThemedView>

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
        </Animated.View>
      </View>

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
