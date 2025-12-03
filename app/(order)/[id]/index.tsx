import { Modal, ScrollView, View } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { useOrderStatus } from "@/presentation/orders/hooks/useOrderStatus";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import OrderDetailCard from "@/presentation/orders/components/order-detail-card";
import { useOrders } from "@/presentation/orders/hooks/useOrders";
import Label from "@/presentation/theme/components/label";
import { useModal } from "@/presentation/shared/hooks/useModal";

dayjs.extend(relativeTime);

export default function OrderScreen() {
  const order = useOrdersStore((state) => state.activeOrder);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const setActiveOrderDetail = useOrdersStore(
    (state) => state.setActiveOrderDetail,
  );
  const { mutate: updateOrder, isOnline, isLoading } = useOrders().updateOrder;
  const { mutate: deleteOrder } = useOrders().deleteOrder;
  const router = useRouter();

  const {
    isOpen: closeModalIsOpen,
    handleOpen: openCloseModal,
    handleClose: closeCloseModal,
  } = useModal();

  const [visible, setVisible] = useState(false);

  if (!order) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText type="h2">No active order selected</ThemedText>
      </ThemedView>
    );
  }

  const openProduct = (detail: OrderDetail) => {
    setActiveOrderDetail(detail);
    router.push("/(order)/edit-order-detail");
  };

  const { statusText, statusTextColor, statusIcon, statusIconColor, bgColor } =
    useOrderStatus(order.status);

  const date = dayjs(order.createdAt).isSame(dayjs(), "day")
    ? `Today, ${dayjs(order.createdAt).format("HH:mm")}`
    : dayjs(order.createdAt).format("dddd, HH:mm");

  const updateStatus = (status: OrderStatus) => {
    updateOrder(
      {
        id: order.id,
        status,
      },
      {
        onSuccess: (resp) => {
          // Handle success if needed
        },
      },
    );
  };

  const onCloseOrder = () => {
    updateOrder(
      {
        id: order.id,
        isClosed: true,
      },
      {
        onSuccess: (resp) => {
          closeCloseModal();
          router.replace("/(tabs)");
          // Handle success if needed
        },
      },
    );
  };

  const closeModal = () => {
    setVisible(false);
  };

  const onRemoveOrder = () => {
    deleteOrder(order.id, {
      onSuccess: () => {
        closeModal();
        setActiveOrder(null);
        router.replace("/(tabs)");
      },
    });
  };

  const orderCantBeDeleted =
    order.status !== OrderStatus.PENDING ||
    order.details.some((detail) => detail.qtyDelivered !== 0);

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
            <ThemedText type="h4">Remove Order</ThemedText>
            <ThemedText type="body1" style={tw`mt-2 mb-4`}>
              Are you sure you want to remove this order? This action cannot be
              undone.
            </ThemedText>

            <ThemedView style={tw`flex-row justify-end gap-2`}>
              <Button
                label="Cancel"
                onPress={closeModal}
                variant="outline"
                size="small"
              />
              <Button label="Remove" onPress={onRemoveOrder} size="small" />
            </ThemedView>
          </View>
        </View>
      </Modal>
      <Modal
        transparent
        visible={closeModalIsOpen}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        {/* Backdrop */}
        <View style={tw`flex-1 bg-black/50 items-center justify-center`}>
          {/* Modal card */}
          <View style={tw`bg-white rounded-2xl w-4/5 p-5 shadow-lg`}>
            <ThemedText type="h3">Close Order</ThemedText>
            <ThemedText type="body1" style={tw`mt-2 mb-4`}>
              Are you sure you want to close this order? The closed orders can't
              be modified.{" "}
            </ThemedText>

            <ThemedView style={tw`flex-row justify-end gap-2`}>
              <Button
                label="Cancel"
                onPress={closeCloseModal}
                variant="outline"
                size="small"
              />
              <Button label="Close" onPress={onCloseOrder} size="small" />
            </ThemedView>
          </View>
        </View>
      </Modal>
      <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
        <ScrollView
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-4 pb-4`}
        >
          <ThemedView style={tw` justify-between   rounded-lg gap-4 mb-4`}>
            <ThemedView
              style={tw`gap-1 bg-transparent flex-row justify-between`}
            >
              <ThemedView style={tw`gap-1 bg-transparent`}>
                <ThemedText type="h3">
                  {order.type === OrderType.IN_PLACE
                    ? `Table ${order.table?.name}`
                    : "Take Away"}{" "}
                </ThemedText>
                <ThemedView
                  style={tw` flex-row  bg-transparent items-center gap-2`}
                >
                  <Ionicons name="people-outline" size={18} />
                  <ThemedText type="body2">{order.people}</ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedView
                style={tw`flex-row items-center bg-transparent gap-2`}
              >
                {order.isPaid ? (
                  <Label text="Paid" color="success" />
                ) : (
                  <Label text="Unpaid" color="warning" />
                )}
                <ThemedView
                  style={tw`gap-1 flex-row items-center ${bgColor}/10 px-3 py-1 rounded-full`}
                >
                  <Ionicons
                    name={statusIcon}
                    size={18}
                    color={tw.color(statusIconColor)}
                  />
                  <ThemedText
                    type="body2"
                    style={tw`${statusTextColor} font-semibold`}
                  >
                    {statusText}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
            {/* <ThemedView style={tw`border-t border-dashed border-gray-700`} /> */}
            <ThemedView style={tw`gap-2 bg-transparent`}>
              <ThemedView>
                <ThemedText type="h4">Order </ThemedText>
                <ThemedText type="body2">{order.num}</ThemedText>
              </ThemedView>
              <ThemedView>
                <ThemedText type="h4">Waiter</ThemedText>
                <ThemedText type="body2">
                  {order.user.person.firstName} {order.user.person.lastName}
                </ThemedText>
              </ThemedView>
              <ThemedView>
                <ThemedText type="h4">Date</ThemedText>
                <ThemedText type="body2">{date}</ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
          {order.notes && (
            <ThemedView style={tw`gap-2`}>
              <ThemedText type="caption">Notes</ThemedText>
              <ThemedText type="body2">{order.notes}</ThemedText>
            </ThemedView>
          )}
          {order.status !== OrderStatus.DELIVERED && (
            <ThemedView style={tw`flex-row justify-between items-center`}>
              {order.status === OrderStatus.IN_PROGRESS && (
                <Button
                  label="Pause"
                  variant="outline"
                  rightIcon="pause-outline"
                  size="small"
                  onPress={() => updateStatus(OrderStatus.PENDING)}
                />
              )}
              <ThemedView style={tw`flex-row items-center gap-2`}></ThemedView>
              {order.status === OrderStatus.IN_PROGRESS && (
                <Button
                  label="Deliver"
                  variant="outline"
                  rightIcon="checkmark-done-outline"
                  size="small"
                  onPress={() => updateStatus(OrderStatus.DELIVERED)}
                />
              )}
              {order.status === OrderStatus.PENDING && (
                <Button
                  label="Start"
                  variant="outline"
                  rightIcon="play-outline"
                  size="small"
                  onPress={() => updateStatus(OrderStatus.IN_PROGRESS)}
                />
              )}
            </ThemedView>
          )}
          {order.details.map((detail, index) => (
            <OrderDetailCard
              key={index}
              detail={detail}
              onPress={() => openProduct(detail)}
            />
          ))}

          <Button
            leftIcon="add-outline"
            label="Add product "
            variant="outline"
            onPress={() => router.push("/restaurant-menu")}
          />
        </ScrollView>
      </ThemedView>
      <ThemedView style={tw`gap-4 p-4 rounded-lg `}>
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <ThemedText type="h3">Total</ThemedText>
          <ThemedText type="h2">${order.total}</ThemedText>
        </ThemedView>
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <ThemedView style={tw`flex-row items-center gap-2`}>
            <IconButton
              icon="trash-outline"
              onPress={() => setVisible(true)}
              color="danger"
              disabled={orderCantBeDeleted}
            />
            {order.status === OrderStatus.DELIVERED && order.isPaid && (
              <Button
                label="Close"
                variant="secondary"
                onPress={openCloseModal}
                leftIcon="lock-closed-outline"
              ></Button>
            )}
          </ThemedView>
          <Button
            label="Payments"
            variant="secondary"
            onPress={() => router.push(`/(order)/${order.id}/bills`)}
            rightIcon="arrow-forward-outline"
          ></Button>
        </ThemedView>
      </ThemedView>
    </>
  );
}
