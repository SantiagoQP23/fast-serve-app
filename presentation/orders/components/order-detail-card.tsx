import React, { useState, useRef, useCallback } from "react";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { View, Pressable, PressableProps, Modal } from "react-native";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import ProgressBar from "@/presentation/theme/components/progress-bar";
import { useOrders } from "../hooks/useOrders";
import { useOrdersStore } from "../store/useOrdersStore";
import Button from "@/presentation/theme/components/button";
import Checkbox from "@/presentation/theme/components/checkbox";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import OrderDetailActionsBottomSheet from "./order-detail-actions-bottom-sheet";

interface OrderDetailCardProps extends PressableProps {
  detail: OrderDetail;
}

export default function OrderDetailCard({
  detail,
  onPress,
}: OrderDetailCardProps) {
  const { t } = useTranslation(["common", "orders"]);
  const order = useOrdersStore((state) => state.activeOrder);
  const [visible, setVisible] = useState(false);
  const [isChecked, setIsChecked] = useState(
    detail.quantity === detail.qtyDelivered,
  );
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const { mutate: updateOrderDetail } = useOrders().updateOrderDetail;

  const { mutate: removeOrderDetail } = useOrders().removeOrderDetail;

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

  const handleOpenBottomSheet = () => {
    bottomSheetModalRef.current?.present();
  };

  const handleCloseBottomSheet = () => {
    bottomSheetModalRef.current?.dismiss();
  };

  const onRemoveDetail = () => {
    handleCloseBottomSheet();
    setVisible(true);
  };

  const handleConfirmDelete = () => {
    removeOrderDetail(
      {
        detailId: detail.id,
        orderId: order!.id,
      },
      {
        onSuccess: () => {
          closeModal();
        },
      },
    );
  };

  const handleEditQuantity = () => {
    if (onPress) {
      onPress({} as any);
    }
  };

  const onCheckedChange = (newValue: boolean) => {
    setIsChecked(newValue);
    const newQtyDelivered = newValue ? detail.quantity : 0;
    updateOrderDetail(
      {
        id: detail.id,
        quantity: detail.quantity,
        orderId: order!.id,
        qtyDelivered: newQtyDelivered,
      },
      {
        onSuccess: () => {},
      },
    );
  };

  const closeModal = () => {
    setVisible(false);
  };

  return (
    <>
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        {/* Backdrop */}
        <View style={tw`flex-1 bg-black/50 items-center justify-center`}>
          {/* Modal card */}
          <View style={tw`bg-white rounded-2xl w-4/5 p-5 shadow-lg`}>
            <ThemedText type="h4">
              {t("orders:dialogs.removeItemTitle")}
            </ThemedText>
            <ThemedText type="body1" style={tw`mt-2 mb-4`}>
              {t("orders:dialogs.removeItemMessage", {
                product: detail.product.name,
              })}
            </ThemedText>

            <ThemedView style={tw`flex-row justify-end gap-2`}>
              <Button
                label={t("common:actions.cancel")}
                onPress={() => setVisible(false)}
                variant="outline"
                size="small"
              />
              <Button
                label={t("common:actions.remove")}
                onPress={handleConfirmDelete}
                size="small"
              />
            </ThemedView>
          </View>
        </View>
      </Modal>
      
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={["30%"]}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
      >
        <OrderDetailActionsBottomSheet
          detail={detail}
          onEditQuantity={handleEditQuantity}
          onDelete={onRemoveDetail}
          onClose={handleCloseBottomSheet}
        />
      </BottomSheetModal>

      <ThemedView>
        <Pressable onPress={onPress} onLongPress={handleOpenBottomSheet}>
          <ThemedView style={tw` bg-transparent gap-4`}>
            <ThemedView style={tw`flex-row bg-transparent items-center gap-4`}>
              <Checkbox value={isChecked} onValueChange={onCheckedChange} />
              <ThemedView style={tw` bg-transparent  gap-2`}>
                <ThemedView
                  style={tw`flex-row justify-between bg-transparent `}
                >
                  <ThemedText type="body1" style={tw`font-bold`}>
                    {detail.quantity} - {detail.product.name}
                  </ThemedText>
                  {/* <ThemedText type="body1">${detail.product.price}</ThemedText> */}
                </ThemedView>
                {detail.description && (
                  <ThemedText type="body2">{detail.description}</ThemedText>
                )}
              </ThemedView>
              <ThemedView style={tw`justify-end items-end bg-transparent`}>
                {/* <ThemedView */}
                {/*   style={tw`flex-row items-center gap-3 bg-transparent`} */}
                {/* > */}
                {/*   {detail.quantity !== counter && ( */}
                {/*     <IconButton */}
                {/*       icon="save-outline" */}
                {/*       onPress={onUpdateOrderDetail} */}
                {/*       variant="outlined" */}
                {/*     /> */}
                {/*   )} */}
                {/**/}
                {/*   <IconButton */}
                {/*     icon="remove-outline" */}
                {/*     onPress={decrement} */}
                {/*     variant="outlined" */}
                {/*   /> */}
                {/*   <ThemedText>{counter}</ThemedText> */}
                {/*   <IconButton */}
                {/*     icon="add" */}
                {/*     onPress={increment} */}
                {/*     variant="outlined" */}
                {/*   /> */}
                {/* </ThemedView> */}
              </ThemedView>
            </ThemedView>
            <ProgressBar
              progress={detail.qtyDelivered / detail.quantity}
              height={1}
            />
          </ThemedView>
        </Pressable>
      </ThemedView>
    </>
  );
}
