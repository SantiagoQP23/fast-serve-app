import { ThemedText } from "@/presentation/theme/components/themed-text";
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
import { useOrders } from "@/presentation/orders/hooks/useOrders";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { ProductStatus } from "@/core/menu/models/product.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import {
  ProductOption,
  getProductOptionAvailableQuantity,
} from "@/core/menu/models/product-optionl.model";
import { Ionicons } from "@expo/vector-icons";
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

export default function ProductScreen() {
  const { t } = useTranslation(["menu", "orders", "inventory"]);
  const bottomSheetModalRef = useRef<BottomSheetMethods>(null);
  const noteSheetRef = useRef<BottomSheetMethods>(null);
  const typePickerRef = useRef<BottomSheetPickerRef>(null);
  const activeOrderDetail = useNewOrderStore((state) => state.activeDetail);
  const orderType = useNewOrderStore((state) => state.orderType);
  const order = useOrdersStore((state) => state.activeOrder);
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
            icon="create-outline"
            onPress={openCustomBottomSheet}
            variant="secondary"
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

  const parsedCustomPrice = parseFloat(price);
  const effectivePrice = Number.isFinite(parsedCustomPrice)
    ? parsedCustomPrice
    : (selectedOption?.price ?? activeProduct.price);

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

  const replaceProductInOrder = () => {
    if (!order || !replacingDetail) return;

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
              {activeProduct.description && (
                <ThemedText type="body1" style={tw`text-gray-600`}>
                  {activeProduct.description}
                </ThemedText>
              )}
            </ThemedView>

            <ThemedView style={tw`flex-row items-center gap-2 flex-wrap my-2 `}>
              {isUnavailable && (
                <Label
                  text={t(`menu:product.status.${activeProduct.status}`)}
                  color={statusLabelColor}
                />
              )}
              <Label
                text={
                  typeOrderDetail === OrderType.IN_PLACE
                    ? t("common:orderType.inPlace")
                    : t("common:orderType.takeAway")
                }
                leftIcon={
                  typeOrderDetail === OrderType.IN_PLACE
                    ? "restaurant-outline"
                    : "bag-outline"
                }
                color="outline"
                onPress={() => typePickerRef.current?.present()}
              />
            </ThemedView>

            {activeOptions.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={tw`gap-3`}
              >
                {activeOptions.map((option) => {
                  const isSelected = selectedOption?.id === option.id;
                  return (
                    <ThemedView key={option.id}>
                      <Card
                        onPress={() => onChangeSelectedOption(option)}
                        variant="outline"
                        style={tw`min-w-36 p-4 gap-2 rounded-3xl border-2 ${isSelected ? "border-light-primary" : "border-transparent"}`}
                      >
                        <ThemedView
                          style={tw`flex-row items-center justify-between gap-2`}
                        >
                          <ThemedText type="body1" style={tw``}>
                            {option.name}
                          </ThemedText>
                          {option.inventoryItems?.length ? (
                            <ThemedView
                              style={tw`flex-row items-center gap-1 bg-transparent`}
                            >
                              <Ionicons
                                name="cube-outline"
                                size={14}
                                color={tw.color("text-gray-500")}
                              />
                              <ThemedText
                                type="small"
                                style={tw`text-gray-500`}
                              >
                                {t("inventory:stockCount", {
                                  count:
                                    getProductOptionAvailableQuantity(option) ??
                                    0,
                                })}
                              </ThemedText>
                            </ThemedView>
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
            {activeProduct.tags?.filter(
              (tag) => tag.isActive && !tag.isArchived,
            ).length > 0 && (
              <ThemedView style={tw`flex-row flex-wrap gap-2 `}>
                {activeProduct.tags
                  .filter((tag) => tag.isActive && !tag.isArchived)
                  .map((tag) => (
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

            <ThemedView
              style={tw`flex-row  items-center gap-4 w-full ${!notes.trim() ? "justify-between" : "justify-center"}`}
            >
              {!notes.trim() && (
                <Button
                  variant="outline"
                  label={t("orders:newOrder.addNote")}
                  leftIcon="document-text-outline"
                  style={tw`h-full flex-1`}
                  onPress={openNoteBottomSheet}
                />
              )}
              <ThemedView style={tw`flex-row items-center gap-6`}>
                <IconButton
                  icon="remove-outline"
                  onPress={decrement}
                  variant="secondary"
                  size={40}
                />
                <ThemedText type="h1">{counter}</ThemedText>
                <IconButton
                  icon="add"
                  onPress={increment}
                  variant="secondary"
                  size={40}
                />
              </ThemedView>
            </ThemedView>

            <ThemedView style={tw`flex-row gap-5  mb-4`}>
              <Button
                label={
                  isReplaceMode
                    ? t("orders:replaceItem.confirm")
                    : t("menu:product.addToOrderOrCart", {
                        type: order
                          ? t("menu:product.order")
                          : t("menu:product.cart"),
                      })
                }
                onPress={onAddProduct}
                leftIcon={
                  isReplaceMode ? "swap-horizontal-outline" : "cart-outline"
                }
                disabled={isUnavailable || isReplacing}
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

      <ThemedBottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={["55%"]}
        enablePanDownToClose
      >
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
