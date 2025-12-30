import React, { useEffect, useState } from "react";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { View, Pressable, PressableProps } from "react-native";
import IconButton from "@/presentation/theme/components/icon-button";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import { useCounter } from "@/presentation/shared/hooks/useCounter";
import ProgressBar from "@/presentation/theme/components/progress-bar";

interface NewBillDetailCardProps extends PressableProps {
  detail: OrderDetail;
  quantity?: number;
  onChange?: (quantity: number) => void;
}

export default function NewBillDetailCard({
  onPress,
  onChange,
  quantity = 0,
  detail,
}: NewBillDetailCardProps) {
  const { counter, increment, decrement, setCounter } = useCounter(
    quantity,
    1,
    detail.quantity - detail.qtyPaid,
    0,
    (value) => {
      onChange && onChange(value);
    },
  );

  useEffect(() => {
    setCounter(quantity);
  }, [quantity, setCounter]);

  return (
    <Pressable
      style={({ pressed }) => [
        tw`mb-3 p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 gap-3`,
        pressed && tw`opacity-80`,
      ]}
      onPress={onPress}
    >
      <ThemedView style={tw`flex-row justify-between items-end bg-transparent`}>
        <ThemedView style={tw` bg-transparent justify-between gap-1`}>
          <ThemedText type="h3" style={tw` font-bold`}>
            {detail.product.name} x{detail.quantity - detail.qtyPaid}
          </ThemedText>
          <ThemedText type="body2">Total: {detail.quantity}</ThemedText>
        </ThemedView>
      </ThemedView>
      <ThemedView
        style={tw`flex-row justify-between items-center bg-transparent`}
      >
        <ThemedText type="h4">${detail.price * counter}</ThemedText>
        <ThemedView style={tw`flex-row items-center gap-4 bg-transparent`}>
          <IconButton
            icon="remove-outline"
            onPress={decrement}
            variant="outlined"
          />
          <ThemedText>{counter}</ThemedText>
          <IconButton icon="add" onPress={increment} variant="outlined" />
        </ThemedView>
      </ThemedView>
      <ProgressBar
        progress={counter / (detail.quantity - detail.qtyPaid)}
        height={1}
      />
    </Pressable>
  );
}
