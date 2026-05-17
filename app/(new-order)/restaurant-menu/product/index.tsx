import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useCallback, useRef, useState } from "react";
import { router } from "expo-router";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
import { useCounter } from "@/presentation/shared/hooks/useCounter";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useOrders } from "@/presentation/orders/hooks/useOrders";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { ProductStatus } from "@/core/menu/models/product.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Chip from "@/presentation/theme/components/chip";
import { ProductOption } from "@/core/menu/models/product-optionl.model";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { KeyboardAvoidingView } from "react-native";

export default function ProductScreen() {
  const { t } = useTranslation(["menu", "orders"]);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const activeOrderDetail = useNewOrderStore((state) => state.activeDetail);
  const { counter, increment, decrement } = useCounter(
    activeOrderDetail?.quantity,
    1,
    20,
    1,
  );
  const { activeProduct } = useMenuStore();
  const [notes, setNotes] = useState(activeOrderDetail?.description || "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    activeOrderDetail?.tagIds ?? [],
  );

  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(
    activeOrderDetail
      ? activeOrderDetail.productOption
      : activeProduct?.options.find((option) => option.isDefault) || null,
  );

  const [price, setPrice] = useState(
    String(activeOrderDetail ? activeOrderDetail.price : selectedOption?.price),
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
  const order = useOrdersStore((state) => state.activeOrder);
  const {
    isLoading,
    isOnline,
    mutate: addOrderDetailToOrder,
  } = useOrders().addOrderDetailToOrder;

  const goToMenu = () => {
    setActiveProduct(null);
    setActiveDetail(null);
    router.back();
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

  const openCustomBottomSheet = () => {
    bottomSheetModalRef.current?.present();
  };

  const closeCustomBottomSheet = () => {
    bottomSheetModalRef.current?.dismiss();
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
      });
    } else {
      updateDetail({
        quantity: counter,
        product: activeProduct!,
        description: notes,
        price: effectivePrice,
        tagIds: selectedTagIds,
        productOption: selectedOption!,
      });
    }
  };

  const onAddProduct = () => {
    if (order) {
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
          <ThemedView style={tw`mb-4 gap-6`}>
            <ThemedView style={tw`gap-2`}>
              <ThemedText type="h2">{activeProduct.name}</ThemedText>
              {activeProduct.description && (
                <ThemedText type="body1" style={tw`text-gray-600`}>
                  {activeProduct.description}
                </ThemedText>
              )}
            </ThemedView>
            {isUnavailable && (
              <Label
                text={t(`menu:product.status.${activeProduct.status}`)}
                color={statusLabelColor}
              />
            )}
            {activeProduct.options.length > 0 && (
              <ThemedView style={tw`flex-row flex-wrap gap-2`}>
                {activeProduct.options.map((option) => (
                  <ThemedView
                    key={option.id}
                    style={tw`justify-center items-center gap-1`}
                  >
                    <Chip
                      label={`${option.name}`}
                      selected={selectedOption?.id === option.id}
                      onPress={() => onChangeSelectedOption(option)}
                    />
                    <ThemedText type="body2" style={tw`text-gray-500`}>
                      {formatCurrency(option.price)}
                    </ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>
            )}
            {activeProduct.tags?.filter(
              (tag) => tag.isActive && !tag.isArchived,
            ).length > 0 && (
              <ThemedView style={tw`flex-row flex-wrap gap-2`}>
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

          <TextInput
            numberOfLines={4}
            multiline
            value={notes}
            onChangeText={setNotes}
            placeholder={t("orders:newOrder.addNote")}
            autoFocus={false}
            containerStyle={tw`border-0 p-0 mb-0 -ml-1 bg-transparent`}
          />

          <ThemedView style={tw`gap-8`}>
            <ThemedView style={tw`flex-row justify-between items-center`}>
              <ThemedView>
                <ThemedText>
                  {formatCurrency(counter * effectivePrice)}
                </ThemedText>
              </ThemedView>
              <ThemedView style={tw`flex-row items-center gap-4`}>
                <IconButton
                  icon="remove-outline"
                  onPress={decrement}
                  variant="outlined"
                />
                <ThemedText>{counter}</ThemedText>
                <IconButton icon="add" onPress={increment} variant="outlined" />
              </ThemedView>
            </ThemedView>

            <ThemedView style={tw`flex-row gap-5 justify-center mb-4`}>
              <Button
                label={t("menu:product.customize")}
                variant="text"
                onPress={openCustomBottomSheet}
              />
              <Button
                label={t("menu:product.addToOrderOrCart", {
                  type: order
                    ? t("menu:product.order")
                    : t("menu:product.cart"),
                })}
                onPress={onAddProduct}
                leftIcon="cart-outline"
                disabled={isUnavailable}
              />
            </ThemedView>
          </ThemedView>
        </ScreenLayout>
      </KeyboardAvoidingView>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={["55%"]}
        backdropComponent={renderBackdrop}
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
      </BottomSheetModal>
    </>
  );
}
