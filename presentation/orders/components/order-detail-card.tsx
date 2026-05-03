import React, { useState, useRef, useCallback } from "react";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { View, Pressable, PressableProps, Modal, Alert } from "react-native";
import {
  OrderDetail,
  OrderDetailStatus,
} from "@/core/orders/models/order-detail.model";
import ProgressBar from "@/presentation/theme/components/progress-bar";
import { useOrders } from "../hooks/useOrders";
import { useOrdersStore } from "../store/useOrdersStore";
import Button from "@/presentation/theme/components/button";
import Checkbox from "@/presentation/theme/components/checkbox";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import OrderDetailActionsBottomSheet from "./order-detail-actions-bottom-sheet";
import { formatCurrency } from "@/core/i18n/utils";
import Label from "@/presentation/theme/components/label";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import IconButton from "@/presentation/theme/components/icon-button";
import { useOrderDetailStatus } from "../hooks/useOrderDetailStatus";
import { Ionicons } from "@expo/vector-icons";

interface OrderDetailCardProps extends PressableProps {
  detail: OrderDetail;
  orderId?: string;
  orderUserId: string;
}

export default function OrderDetailCard({
  detail,
  onPress,
  orderId,
  orderUserId,
}: OrderDetailCardProps) {
  const { t } = useTranslation(["common", "orders"]);
  const order = useOrdersStore((state) => state.activeOrder);
  const [visible, setVisible] = useState(false);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const deliveredSheetRef = useRef<BottomSheetModal>(null);
  const [deliveredDraft, setDeliveredDraft] = useState(detail.qtyDelivered);

  const createdBy = detail.createdBy;
  const updatedBy = detail.updatedBy;

  const showCreatedBy = createdBy && createdBy.id !== orderUserId;
  const showUpdatedBy = updatedBy && updatedBy.id !== orderUserId;

  const { mutate: updateOrderDetail } = useOrders().updateOrderDetail;

  const { mutate: removeOrderDetail } = useOrders().removeOrderDetail;
  const { statusText, statusIcon, labelColor, statusIconColor } =
    useOrderDetailStatus(detail.status);
  const isCancelled = detail.status === OrderDetailStatus.CANCELLED;

  // Derive checkbox state directly from props (no local state needed)
  const isChecked = detail.quantity === detail.qtyDelivered;

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
    if (isCancelled) return;
    bottomSheetModalRef.current?.present();
  };

  const handleCloseBottomSheet = () => {
    bottomSheetModalRef.current?.dismiss();
  };

  const handleOpenDeliveredSheet = () => {
    if (isCancelled) return;
    setDeliveredDraft(detail.qtyDelivered);
    deliveredSheetRef.current?.present();
  };

  const handleCloseDeliveredSheet = () => {
    deliveredSheetRef.current?.dismiss();
  };

  const onRemoveDetail = () => {
    if (detail.qtyDelivered > 0) {
      Alert.alert(
        t("orders:deleteAlerts.cannotDeleteDetailTitle"),
        t("orders:deleteAlerts.cannotDeleteDetailMessage"),
      );
      return;
    }
    handleCloseBottomSheet();
    setVisible(true);
  };

  const handleConfirmDelete = () => {
    const currentOrderId = orderId || order?.id;
    if (!currentOrderId) return;

    updateOrderDetail(
      {
        id: detail.id,
        orderId: currentOrderId,
        status: OrderDetailStatus.CANCELLED,
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
    const currentOrderId = orderId || order?.id;
    if (!currentOrderId) return;

    const newQtyDelivered = newValue ? detail.quantity : 0;
    updateOrderDetail(
      {
        id: detail.id,
        quantity: detail.quantity,
        orderId: currentOrderId,
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

  const handleSaveDelivered = () => {
    const currentOrderId = orderId || order?.id;
    if (!currentOrderId) return;

    updateOrderDetail(
      {
        id: detail.id,
        quantity: detail.quantity,
        orderId: currentOrderId,
        qtyDelivered: deliveredDraft,
      },
      {
        onSuccess: () => {
          handleCloseDeliveredSheet();
        },
      },
    );
  };

  const showProductOptionName =
    detail.product.options.length > 1 && detail.productOption;

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

      <BottomSheetModal
        ref={deliveredSheetRef}
        snapPoints={["30%"]}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
      >
        <BottomSheetView style={tw`px-4 pb-6`}>
          <ThemedView style={tw`mb-4`}>
            <ThemedText type="h3">{t("common:status.delivered")}</ThemedText>
            <ThemedText type="body2" style={tw`text-gray-500 mt-1`}>
              {detail.product.name}
            </ThemedText>
          </ThemedView>
          <ThemedView style={tw`flex-row items-center justify-between mb-4`}>
            <IconButton
              icon="remove-outline"
              onPress={() =>
                setDeliveredDraft((current) => Math.max(0, current - 1))
              }
              variant="outlined"
              disabled={deliveredDraft <= 0}
            />
            <ThemedText type="h3">
              {deliveredDraft} / {detail.quantity}
            </ThemedText>
            <IconButton
              icon="add"
              onPress={() =>
                setDeliveredDraft((current) =>
                  Math.min(detail.quantity, current + 1),
                )
              }
              variant="outlined"
              disabled={deliveredDraft >= detail.quantity}
            />
          </ThemedView>
          <Button
            label={t("common:actions.save")}
            onPress={handleSaveDelivered}
          />
        </BottomSheetView>
      </BottomSheetModal>

      <ThemedView style={tw``}>
        <Swipeable
          renderRightActions={
            isCancelled
              ? undefined
              : () => (
                  <ThemedView style={tw`justify-center  pl-2 `}>
                    <IconButton
                      icon="trash-outline"
                      color="red"
                      onPress={onRemoveDetail}
                    />
                  </ThemedView>
                )
          }
        >
          <Pressable
            onPress={isCancelled ? undefined : onPress}
            onLongPress={isCancelled ? undefined : handleOpenBottomSheet}
          >
            <ThemedView style={tw`flex-row items-start gap-4`}>
              {!isCancelled && (
                <Checkbox value={isChecked} onValueChange={onCheckedChange} />
              )}
              <ThemedView style={tw` bg-transparent gap-2  flex-1`}>
                <ThemedView
                  style={tw`flex-row bg-transparent items-center gap-4`}
                >
                  <ThemedView style={tw`flex-1 bg-transparent gap-2`}>
                    <ThemedView style={tw` bg-transparent  gap-2`}>
                      <ThemedView
                        style={tw`flex-row justify-between bg-transparent gap-2 items-center`}
                      >
                        <ThemedView
                          style={tw`flex-row justify-between bg-transparent gap-2 items-center whitespace-normal`}
                        >
                          {/* <Ionicons */}
                          {/*   name={statusIcon} */}
                          {/*   size={16} */}
                          {/*   color={tw.color(statusIconColor)} */}
                          {/*   weight="bold" */}
                          {/* /> */}
                          <ThemedText type="body1" style={tw`whitespace-wrap`}>
                            {detail.quantity} - {detail.product.name}{" "}
                            {showProductOptionName &&
                              detail.productOption?.name}
                          </ThemedText>

                          {detail.productOption &&
                            detail.productOption.price !== detail.price && (
                              <Label
                                text={formatCurrency(detail.price)}
                                color="default"
                                size="small"
                              />
                            )}
                        </ThemedView>
                        <ThemedText type="body2">
                          {formatCurrency(detail.amount)}
                        </ThemedText>
                      </ThemedView>
                      {detail.description && (
                        <ThemedText type="body2">
                          {detail.description}
                        </ThemedText>
                      )}
                      {detail.tags?.length > 0 && (
                        <ThemedView
                          style={tw`flex-row flex-wrap gap-2 bg-transparent`}
                        >
                          {detail.tags.map((tag) => (
                            <Label
                              key={tag.id}
                              text={tag.name}
                              color="default"
                              size="small"
                            />
                          ))}
                        </ThemedView>
                      )}
                    </ThemedView>
                    {!isCancelled && detail.quantity > 1 && (
                      <ProgressBar
                        progress={detail.qtyDelivered / detail.quantity}
                        height={1}
                      />
                    )}
                  </ThemedView>
                </ThemedView>
                <ThemedView style={tw`flex-row gap-4 flex-wrap`}>
                  <Label
                    text={statusText}
                    color={labelColor}
                    leftIcon={statusIcon}
                    size="small"
                    onPress={isCancelled ? undefined : handleOpenDeliveredSheet}
                  />

                  <Label
                    leftIcon="notifications-outline"
                    text={String(detail.readyQuantity)}
                    color="default"
                    size="small"
                  />

                  {showCreatedBy && (
                    <Label
                      text={detail.createdBy?.person.firstName || ""}
                      leftIcon="person-outline"
                      size="small"
                      color="default"
                    />
                  )}
                  {showUpdatedBy && (
                    <Label
                      text={detail.updatedBy?.person.firstName || ""}
                      color="default"
                      leftIcon="person-outline"
                      size="small"
                    />
                  )}
                </ThemedView>
              </ThemedView>
            </ThemedView>
          </Pressable>
        </Swipeable>
      </ThemedView>
    </>
  );
}
