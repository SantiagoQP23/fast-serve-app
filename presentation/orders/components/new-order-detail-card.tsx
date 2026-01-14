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

interface NewOrderDetailCardProps extends PressableProps {
  detail: NewOrderDetail;
}

export default function NewOrderDetailCard({
  detail,
  onPress,
}: NewOrderDetailCardProps) {
  const { removeDetail, updateDetail } = useNewOrderStore();
  const { counter, increment, decrement } = useCounter(
    detail.quantity,
    1,
    20,
    1,
    (value) => {
      const updatedDetail = { ...detail, quantity: value };
      updateDetail(updatedDetail);
    },
  );

  const onRemoveDetail = () => {
    removeDetail(detail);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        tw` rounded-2xl  dark:bg-gray-800 border border-light-border`,
        pressed && tw`opacity-80`,
      ]}
      onPress={onPress}
    >
      <ThemedView style={tw`flex-col bg-transparent p-4 gap-4`}>
        {/* <ThemedView */}
        {/*   style={tw`absolute  rounded-full items-center justify-center  z-10 right-0 top-0`} */}
        {/* ></ThemedView> */}
        <ThemedView
          style={tw`flex-row bg-transparent justify-between items-start gap-2`}
        >
          <ThemedView>
            <ThemedText type="h3" style={tw` font-bold`}>
              {detail.product.name}
            </ThemedText>
            {detail.description && (
              <ThemedText type="body2">{detail.description}</ThemedText>
            )}
          </ThemedView>
          <IconButton
            icon="close-outline"
            style={tw`bg-gray-100`}
            size={18}
            onPress={onRemoveDetail}
          />
        </ThemedView>
        <ThemedView
          style={tw`flex-row bg-transparent justify-between gap-2 items-center`}
        >
          <ThemedText type="body1" style={tw`text-light-primary font-semibold`}>
            ${detail.product.price * counter}
          </ThemedText>
          <ThemedView style={tw`flex-row items-center gap-3 bg-transparent`}>
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
    </Pressable>
  );
}
