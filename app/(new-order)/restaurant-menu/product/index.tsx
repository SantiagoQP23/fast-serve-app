import { ThemedText } from "@/presentation/theme/components/themed-text";
import { getSelectableTags } from "@/core/menu/models/tag.model";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useEffect, useMemo, useRef, useState } from "react";
import { router, useNavigation } from "expo-router";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
import { useCounter } from "@/presentation/shared/hooks/useCounter";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
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
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
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
import { KeyboardAvoidingView, ScrollView } from "react-native";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import NoteBottomSheet from "@/presentation/orders/components/note-bottom-sheet";
import Card from "@/presentation/theme/components/card";
import Chip from "@/presentation/theme/components/chip";

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

export default function ProductScreen() {
  const { t } = useTranslation(["menu", "orders", "inventory"]);
  const bottomSheetModalRef = useRef<BottomSheetMethods>(null);
  const noteSheetRef = useRef<BottomSheetMethods>(null);
  const typePickerRef = useRef<BottomSheetPickerRef>(null);
  const activeOrderDetail = useNewOrderStore((state) => state.activeDetail);
  const orderType = useNewOrderStore((state) => state.orderType);
  // While a direct sale is being edited, products go to that sale, never to
  // an order or the cart, whatever order is still marked active.
  const isSaleEditMode = useEditSaleStore((state) => state.billId !== null);
  const saleLines = useEditSaleStore((state) => state.lines);
  const addSaleLine = useEditSaleStore((state) => state.addLine);
  const activeOrder = useOrdersStore((state) => state.activeOrder);
  const order = isSaleEditMode ? null : activeOrder;
  const replaceOrderId = useReplaceOrderDetailStore((state) => state.orderId);
  const replacingDetail = useReplaceOrderDetailStore((state) => state.detail);
  const resetReplace = useReplaceOrderDetailStore((state) => state.reset);
  const isReplaceMode =
    !!order && !!replacingDetail && replaceOrderId === order.id;
  const { counter, increment, decrement } = useCounter(
    activeOrderDetail?.quantity ??
      (isReplaceMode ? replacingDetail.quantity : undefined),
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

  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(
    activeOrderDetail
      ? activeOrderDetail.productOption
      : activeOptions.find((option) => option.isDefault) || null,
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
      : isReplaceMode
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

  const addDetail = useNewOrderStore((state) => state.addDetail);
  const updateDetail = useNewOrderStore((state) => state.updateDetail);
  const setActiveProduct = useMenuStore((state) => state.setActiveProduct);
  const setActiveDetail = useNewOrderStore((state) => state.setActiveDetail);
  const editOrderId = useEditOrderCartStore((state) => state.orderId);
  const addEditItem = useEditOrderCartStore((state) => state.addNewItem);
  const updateEditItem = useEditOrderCartStore((state) => state.updateNewItem);
  const isEditMode = !!order && editOrderId === order.id;
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
  const { settings } = useRestaurantSettings();
  // With the setting off, the server rejects anything beyond the stock left,
  // so don't let the waiter ask for it.
  const blocksWithoutStock =
    (settings?.ALLOW_ORDERS_WITHOUT_STOCK ??
      DEFAULT_ALLOW_ORDERS_WITHOUT_STOCK) === false;

  const {
    isLoading,
    isOnline,
    mutate: addOrderDetailToOrder,
  } = useOrders().addOrderDetailToOrder;
  const { isLoading: isReplacing, mutate: replaceOrderDetail } =
    useOrders().replaceOrderDetail;

  const goToMenu = () => {
    setActiveProduct(null);
    setActiveDetail(null);
    router.back();
  };

  const openCustomBottomSheet = () => {
    bottomSheetModalRef.current?.present();
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        isAdmin ? (
          <IconButton
            icon="square-pen"
            onPress={openCustomBottomSheet}
            size={24}
          />
        ) : null,
    });
  }, [navigation, openCustomBottomSheet, isAdmin]);

  const closeCustomBottomSheet = () => {
    bottomSheetModalRef.current?.dismiss();
  };

  const openNoteBottomSheet = () => {
    noteSheetRef.current?.present();
  };

  const closeNoteBottomSheet = () => {
    noteSheetRef.current?.dismiss();
  };

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

  const addProductToOrder = () => {
    if (activeProduct && order)
      addOrderDetailToOrder(
        {
          productId: activeProduct!.id,
          quantity: counter,
          price: effectivePrice,
          description: notes,
          orderId: order!.id,
          tagIds: selectedTagIds,
          productOptionId: selectedOption!.id,
          typeOrderDetail: typeOrderDetail || order!.type,
        },
        {},
      );
  };

  const addProductToCart = () => {
    if (!activeOrderDetail) {
      addDetail({
        quantity: counter,
        product: activeProduct!,
        description: notes,
        price: effectivePrice,
        tagIds: selectedTagIds,
        productOption: selectedOption!,
        typeOrderDetail,
      });
    } else {
      updateDetail({
        id: activeOrderDetail.id,
        quantity: counter,
        product: activeProduct!,
        description: notes,
        price: effectivePrice,
        tagIds: selectedTagIds,
        productOption: selectedOption!,
        typeOrderDetail,
      });
    }
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
          productId: activeProduct!.id,
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
          setActiveProduct(null);
          setActiveDetail(null);
          resetReplace();
          // Close the whole menu flow and land back on the order.
          navigation.getParent()?.goBack();
        },
      },
    );
  };

  const onAddProduct = () => {
    if (isSaleEditMode) {
      addSaleLine({
        product: activeProduct!,
        productOption: selectedOption!,
        price: effectivePrice,
        quantity: counter,
      });
      goToMenu();
      return;
    }

    if (isReplaceMode) {
      replaceProductInOrder();
      return;
    }

    if (isEditMode) {
      if (activeOrderDetail?.id) {
        updateEditItem(activeOrderDetail.id, {
          quantity: counter,
          product: activeProduct!,
          description: notes,
          price: effectivePrice,
          tagIds: selectedTagIds,
          productOption: selectedOption!,
          typeOrderDetail: typeOrderDetail || order!.type,
        });
      } else {
        addEditItem({
          quantity: counter,
          product: activeProduct!,
          description: notes,
          price: effectivePrice,
          tagIds: selectedTagIds,
          productOption: selectedOption!,
          typeOrderDetail: typeOrderDetail || order!.type,
        });
      }
    } else if (order) {
      addProductToOrder();
    } else {
      addProductToCart();
    }
    goToMenu();
  };

  const onChangeSelectedOption = (option: ProductOption) => {
    setSelectedOption(option);
    setPrice(String(option.price));
  };

  return (
    <>
      <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
        <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
          <ThemedView style={tw`flex-1`} />
          <ThemedView style={tw` text-center mb-4 gap-4`}>
            <ThemedView style={tw`gap-2`}>
              <ThemedView
                style={tw`flex-row items-center justify-between gap-2`}
              >
                <ThemedText type="h2">{activeProduct.name}</ThemedText>
                <ThemedText>
                  {formatCurrency(counter * effectivePrice)}
                </ThemedText>
              </ThemedView>
              {activeOptions.length === 1 && selectedOption && (
                <ThemedView style={tw`flex-row items-center gap-3 flex-wrap`}>
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {selectedOption.name} ·{" "}
                    {formatCurrency(selectedOption.price)}
                  </ThemedText>
                  {/* Products with variants show stock on each variant card instead. */}
                  {selectedStock && (
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
              {activeProduct.description && (
                <ThemedText type="body1" style={tw`text-gray-600`}>
                  {activeProduct.description}
                </ThemedText>
              )}
            </ThemedView>

            {notes.trim() && (
              <TextInput
                numberOfLines={4}
                multiline
                value={notes}
                onChangeText={setNotes}
                placeholder={t("orders:newOrder.addNote")}
                pointerEvents="none"
              />
            )}

            {isUnavailable && (
              <ThemedView
                style={tw`flex-row items-center gap-2 flex-wrap my-2 `}
              >
                <Label
                  text={t(`menu:product.status.${activeProduct.status}`)}
                  color={statusLabelColor}
                />
              </ThemedView>
            )}

            {activeOptions.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={tw`gap-3`}
              >
                {activeOptions.map((option) => {
                  const isSelected = selectedOption?.id === option.id;
                  const optionStock = getOptionStock(option);
                  return (
                    <ThemedView key={option.id}>
                      <Card
                        onPress={() => onChangeSelectedOption(option)}
                        variant={isSelected ? "default" : "outline"}
                        style={tw`min-w-36 p-4 gap-2  ${isSelected ? "border-2 border-primary" : "border-none"}`}
                      >
                        <ThemedView
                          style={tw`flex-row items-center justify-between gap-2`}
                        >
                          <ThemedText type="body1" style={tw``}>
                            {option.name}
                          </ThemedText>
                          {optionStock ? (
                            <ThemedText
                              type="small"
                              style={tw`${STOCK_TEXT_COLOR[optionStock.level]}`}
                            >
                              {optionStock.level === "out"
                                ? t("menu:product.stock.out")
                                : t("menu:product.stock.left", {
                                    count: optionStock.remaining,
                                  })}
                            </ThemedText>
                          ) : null}
                        </ThemedView>
                        <ThemedText type="body2" style={tw``}>
                          {formatCurrency(option.price)}
                        </ThemedText>
                      </Card>
                    </ThemedView>
                  );
                })}
              </ScrollView>
            )}
            {getSelectableTags(activeProduct.tags).length > 0 && (
              <ThemedView style={tw`flex-row flex-wrap gap-2 `}>
                {getSelectableTags(activeProduct.tags).map((tag) => (
                  <Label
                    key={tag.id}
                    text={tag.name}
                    color={
                      selectedTagIds.includes(tag.id) ? "default" : "outline"
                    }
                    onPress={() => toggleTag(tag.id)}
                  />
                ))}
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView style={tw`gap-8`}>
            <ThemedView style={tw`items-center gap-3 w-full`}>
              <ThemedView style={tw`flex-row items-center gap-6`}>
                <IconButton
                  icon="minus"
                  onPress={decrement}
                  variant="surface"
                  size={40}
                />
                <ThemedText type="h1">{counter}</ThemedText>
                <IconButton
                  icon="plus"
                  onPress={increment}
                  variant="surface"
                  size={40}
                  disabled={atStockLimit}
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

            {!isSaleEditMode && (
              <ThemedView
                style={tw`flex-row items-center justify-center gap-2 `}
              >
                <Chip
                  label={
                    typeOrderDetail === OrderType.IN_PLACE
                      ? t("common:orderType.inPlace")
                      : t("common:orderType.takeAway")
                  }
                  icon={
                    typeOrderDetail === OrderType.IN_PLACE
                      ? "utensils"
                      : "shopping-bag"
                  }
                  variant="filter"
                  onPress={() => typePickerRef.current?.present()}
                />

                {!notes.trim() && (
                  <Chip
                    variant="assist"
                    label={t("orders:newOrder.addNote")}
                    icon="file-text"
                    onPress={openNoteBottomSheet}
                  />
                )}
              </ThemedView>
            )}

            <ThemedView style={tw`flex-row gap-5  mb-4`}>
              <Button
                label={
                  isSaleEditMode
                    ? t("bills:editSale.addToSale")
                    : isReplaceMode
                      ? t("orders:replaceItem.confirm")
                      : t("menu:product.addToOrderOrCart", {
                          type: order
                            ? t("menu:product.order")
                            : t("menu:product.cart"),
                        })
                }
                onPress={onAddProduct}
                leftIcon={isReplaceMode ? "arrow-left-right" : "shopping-cart"}
                disabled={
                  isUnavailable ||
                  blockedByStock ||
                  isReplacing ||
                  requiresOptionSelection ||
                  (isSaleEditMode && !selectedOption)
                }
                style={tw`flex-1`}
              />
            </ThemedView>
          </ThemedView>
        </ScreenLayout>
      </KeyboardAvoidingView>

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

      <ThemedBottomSheetModal ref={bottomSheetModalRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
          <TextInput
            label={t("orders:newOrder.customPrice")}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            bottomSheet
          />

          <Button
            label={t("menu:product.saveDetails")}
            onPress={closeCustomBottomSheet}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>

      <NoteBottomSheet
        ref={noteSheetRef}
        initialValue={notes}
        onSave={(note) => {
          setNotes(note);
          closeNoteBottomSheet();
        }}
        placeholder={t("orders:newOrder.addNote")}
      />
    </>
  );
}
