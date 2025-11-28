import React, { useEffect, useState } from "react";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { View, Pressable, PressableProps } from "react-native";
import IconButton from "@/presentation/theme/components/icon-button";
import { useCounter } from "@/presentation/shared/hooks/useCounter";
import { router } from "expo-router";
import { NewOrderDetail } from "@/core/orders/dto/new-order-detail.dto";
import { useNewOrderStore } from "../store/newOrderStore";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import ProgressBar from "@/presentation/theme/components/progress-bar";
import { useOrders } from "../hooks/useOrders";
import { useOrdersStore } from "../store/useOrdersStore";

interface OrderDetailCardProps extends PressableProps {
  detail: OrderDetail;
}

export default function OrderDetailCard({
  detail,
  onPress,
}: OrderDetailCardProps) {
  const { removeDetail, updateDetail } = useNewOrderStore();
  const { counter, increment, decrement } = useCounter(
    detail.quantity,
    1,
    20,
    detail.qtyDelivered,
    (value) => {
      const updatedDetail = { ...detail, quantity: value };
      updateDetail(updatedDetail);
    },
  );
  const order = useOrdersStore((state) => state.activeOrder);

  const {
    isOnline,
    isLoading,
    mutate: updateOrderDetail,
  } = useOrders().updateOrderDetail;

  const onRemoveDetail = () => {
    removeDetail(detail);
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

  return (
    <Pressable
      style={({ pressed }) => [
        tw` rounded-2xl bg-gray-100 dark:bg-gray-800`,
        pressed && tw`opacity-80`,
      ]}
      onPress={onPress}
    >
      <ThemedView style={tw` bg-transparent p-4 gap-4`}>
        <ThemedView
          style={tw`absolute  rounded-full items-center justify-center  z-10 right-1 top-1`}
        >
          <IconButton
            icon="close-outline"
            style={tw`bg-gray-100`}
            size={18}
            onPress={onRemoveDetail}
          />
        </ThemedView>
        <ThemedView style={tw`flex-row bg-transparent justify-between gap-6`}>
          <ThemedView style={tw` bg-transparent  gap-2`}>
            <ThemedText type="h3" style={tw` font-bold`}>
              {detail.product.name}
            </ThemedText>
            <ThemedText type="body1">${detail.product.price}</ThemedText>
            {detail.description && (
              <ThemedText type="body2">{detail.description}</ThemedText>
            )}
          </ThemedView>
          <ThemedView style={tw`justify-end items-end bg-transparent`}>
            <ThemedView style={tw`flex-row items-center gap-3 bg-transparent`}>
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
              <IconButton icon="add" onPress={increment} variant="outlined" />
            </ThemedView>
          </ThemedView>
        </ThemedView>
        <ProgressBar
          progress={detail.qtyDelivered / detail.quantity}
          height={1}
        />
      </ThemedView>
    </Pressable>
  );
}
