import React, { useEffect, useState } from "react";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { View, Pressable, PressableProps, Modal } from "react-native";
import IconButton from "@/presentation/theme/components/icon-button";
import { useCounter } from "@/presentation/shared/hooks/useCounter";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import ProgressBar from "@/presentation/theme/components/progress-bar";
import { useOrders } from "../hooks/useOrders";
import { useOrdersStore } from "../store/useOrdersStore";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";

interface OrderDetailCardProps extends PressableProps {
  detail: OrderDetail;
}

export default function OrderDetailCard({
  detail,
  onPress,
}: OrderDetailCardProps) {
  const { counter, increment, decrement } = useCounter(
    detail.quantity,
    1,
    20,
    detail.qtyDelivered,
  );
  const order = useOrdersStore((state) => state.activeOrder);
  const [visible, setVisible] = useState(false);

  const {
    isOnline,
    isLoading,
    mutate: updateOrderDetail,
  } = useOrders().updateOrderDetail;

  const { mutate: removeOrderDetail } = useOrders().removeOrderDetail;

  const onRemoveDetail = () => {
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

  const onUpdateOrderDetail = () => {
    updateOrderDetail(
      {
        id: detail.id,
        quantity: counter,
        orderId: order!.id,
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
            <ThemedText type="h4">Remove Item</ThemedText>
            <ThemedText type="body1" style={tw`mt-2 mb-4`}>
              Are you sure you want to remove {detail.product.name} from the
              order?
            </ThemedText>

            <ThemedView style={tw`flex-row justify-end gap-2`}>
              <Button
                label="Cancel"
                onPress={() => setVisible(false)}
                variant="outline"
                size="small"
              />
              <Button label="Remove" onPress={onRemoveDetail} size="small" />
            </ThemedView>
          </View>
        </View>
      </Modal>
      <ThemedView>
        <ThemedView
          style={tw`absolute  rounded-full items-center justify-center  z-10 right-1 top-1`}
        >
          <IconButton
            icon="close-outline"
            style={tw`bg-gray-100`}
            size={18}
            onPress={() => setVisible(true)}
          />
        </ThemedView>
        <Card onPress={onPress}>
          <ThemedView style={tw` bg-transparent gap-4`}>
            <ThemedView
              style={tw`flex-row bg-transparent justify-between gap-6`}
            >
              <ThemedView style={tw` bg-transparent  gap-2`}>
                <ThemedText type="body1" style={tw` font-bold`}>
                  {detail.quantity} - {detail.product.name}
                </ThemedText>
                <ThemedText type="body1">${detail.product.price}</ThemedText>
                {detail.description && (
                  <ThemedText type="body2">{detail.description}</ThemedText>
                )}
              </ThemedView>
              <ThemedView style={tw`justify-end items-end bg-transparent`}>
                <ThemedView
                  style={tw`flex-row items-center gap-3 bg-transparent`}
                >
                  {detail.quantity !== counter && (
                    <IconButton
                      icon="save-outline"
                      onPress={onUpdateOrderDetail}
                      variant="outlined"
                    />
                  )}

                  <IconButton
                    icon="remove-outline"
                    onPress={decrement}
                    variant="outlined"
                  />
                  <ThemedText>{counter}</ThemedText>
                  <IconButton
                    icon="add"
                    onPress={increment}
                    variant="outlined"
                  />
                </ThemedView>
              </ThemedView>
            </ThemedView>
            <ProgressBar
              progress={detail.qtyDelivered / detail.quantity}
              height={1}
            />
          </ThemedView>
        </Card>
      </ThemedView>
    </>
  );
}
