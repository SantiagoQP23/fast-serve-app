import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "expo-router";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
import { useCounter } from "@/presentation/shared/hooks/useCounter";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useOrders } from "@/presentation/orders/hooks/useOrders";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Chip from "@/presentation/theme/components/chip";
import { ProductOption } from "@/core/menu/models/product-optionl.model";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useOrderDetailStatus } from "@/presentation/orders/hooks/useOrderDetailStatus";
import { OrderDetailStatus } from "@/core/orders/models/order-detail.model";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAvoidingView } from "react-native";

export default function EditOrderDetailScreen() {
  const { t } = useTranslation(["common", "orders", "menu"]);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const orderDetail = useOrdersStore((state) => state.activeOrderDetail);
  const order = useOrdersStore((state) => state.activeOrder);

  const { counter, increment, decrement } = useCounter(
    orderDetail?.quantity,
    1,
    20,
    orderDetail?.qtyDelivered || 1,
  );

  const {
    counter: qtyDelivered,
    increment: incrementDelivered,
    decrement: decrementDelivered,
  } = useCounter(orderDetail?.qtyDelivered, 1, orderDetail?.quantity, 0);

  const router = useRouter();
  const {
    isOnline,
    isLoading,
    mutate: updateOrderDetail,
  } = useOrders().updateOrderDetail;

  const [notes, setNotes] = useState(orderDetail?.description || "");
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(
    orderDetail?.productOption ??
      orderDetail?.product.options.find((option) => option.isDefault) ??
      null,
  );
  const [price, setPrice] = useState(
    String(orderDetail?.price ?? selectedOption?.price ?? ""),
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    orderDetail?.tags?.map((t) => t.id) ?? [],
  );

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const setActiveOrderDetail = useOrdersStore(
    (state) => state.setActiveOrderDetail,
  );

  const { statusText, statusIcon, labelColor } = useOrderDetailStatus(
    orderDetail?.status || OrderDetailStatus.PENDING,
  );

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

  if (!orderDetail) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText type="h2">{t("orders:details.noActiveOrder")}</ThemedText>
      </ThemedView>
    );
  }

  const parsedPrice = parseFloat(price);
  const effectivePrice = Number.isFinite(parsedPrice)
    ? parsedPrice
    : (selectedOption?.price ?? orderDetail.price);

  const onChangeSelectedOption = (option: ProductOption) => {
    setSelectedOption(option);
    setPrice(String(option.price));
  };

  const onUpdateOrderDetail = () => {
    updateOrderDetail(
      {
        id: orderDetail.id,
        quantity: counter,
        qtyDelivered,
        description: notes,
        price: effectivePrice,
        orderId: order!.id,
        tagIds: selectedTagIds,
        productOptionId: selectedOption?.id,
      },
      {
        onSuccess: () => {
          setActiveOrderDetail(null);
          router.back();
        },
      },
    );
  };

  return (
    <>
      <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
        <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
          <ThemedView style={tw`flex-1`} />
          <ThemedView style={tw` text-center mb-4 gap-6`}>
            <ThemedView style={tw` gap-2 `}>
              <ThemedText type="h2">{orderDetail.product.name}</ThemedText>
              {orderDetail.product.description && (
                <ThemedText type="body1" style={tw`text-gray-600`}>
                  {orderDetail.product.description}
                </ThemedText>
              )}
            </ThemedView>

            <ThemedView style={tw`flex-row `}>
              <Label
                text={statusText}
                color={labelColor}
                leftIcon={statusIcon}
                size="small"
              />
              <ThemedView style={tw`flex-row items-center gap-1 ml-4`}>
                <Ionicons name="notifications-outline" />
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {orderDetail.readyQuantity}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView>
              {orderDetail.product.options.length > 0 && (
                <ThemedView style={tw`flex-row flex-wrap gap-2 `}>
                  {orderDetail.product.options.map((option) => (
                    <ThemedView
                      key={option.id}
                      style={tw`justify-center items-center gap-1`}
                    >
                      <Chip
                        label={`${option.name}`}
                        selected={selectedOption?.id === option.id}
                        onPress={() => onChangeSelectedOption(option)}
                      />
                      <ThemedText
                        type="body2"
                        style={tw`text-center text-gray-500`}
                      >
                        {formatCurrency(option.price)}
                      </ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              )}
            </ThemedView>
            {orderDetail.product.tags?.filter(
              (tag) => tag.isActive && !tag.isArchived,
            ).length > 0 && (
              <ThemedView style={tw`flex-row flex-wrap gap-2 `}>
                {orderDetail.product.tags
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
            containerStyle={tw`border-0 p-0 mb-0 -ml-1`}
          />

          {orderDetail.product.description && (
            <ThemedText type="body2">
              {orderDetail.product.description}
            </ThemedText>
          )}

          <ThemedView style={tw`gap-8`}>
            {/* <ThemedView style={tw`flex-row justify-between items-center`}> */}
            {/*   <ThemedText type="h4">{t("common:status.delivered")}</ThemedText> */}
            {/*   <ThemedView style={tw`flex-row items-center gap-4`}> */}
            {/*     <IconButton */}
            {/*       icon="remove-outline" */}
            {/*       onPress={decrementDelivered} */}
            {/*       variant="outlined" */}
            {/*     /> */}
            {/*     <ThemedText>{qtyDelivered}</ThemedText> */}
            {/*     <IconButton */}
            {/*       icon="add" */}
            {/*       onPress={incrementDelivered} */}
            {/*       variant="outlined" */}
            {/*     /> */}
            {/*   </ThemedView> */}
            {/* </ThemedView> */}

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

            {notes && (
              <ThemedView style={tw`justify-center items-center`}>
                <ThemedText type="h4" style={tw`text-gray-600`}>
                  {notes}
                </ThemedText>
              </ThemedView>
            )}

            <ThemedView style={tw`flex-row gap-5 justify-center mb-4`}>
              <Button
                label={t("menu:product.customize")}
                variant="text"
                onPress={openCustomBottomSheet}
              />
              <Button
                label={t("orders:edit.saveChanges")}
                onPress={onUpdateOrderDetail}
                leftIcon="save-outline"
              />
            </ThemedView>
          </ThemedView>
        </ScreenLayout>

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
      </KeyboardAvoidingView>
    </>
  );
}
