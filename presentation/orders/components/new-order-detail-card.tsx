import React, { useState } from "react";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { View, Pressable, PressableProps } from "react-native";
import IconButton from "@/presentation/theme/components/icon-button";
import { useCounter } from "@/presentation/shared/hooks/useCounter";
import { router } from "expo-router";

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface NewOrderDetailCardProps extends PressableProps {
  product: Product;
}

export default function OrderDetailCard({
  product,
  onPress,
}: NewOrderDetailCardProps) {
  const { counter, increment, decrement } = useCounter(1, 1, 20, 1);
  return (
    <Pressable
      style={({ pressed }) => [
        tw` rounded-2xl bg-gray-100 dark:bg-gray-800`,
        pressed && tw`opacity-80`,
      ]}
      onPress={onPress}
    >
      <ThemedView
        style={tw`flex-row justify-between items-end bg-transparent p-4`}
      >
        <ThemedView
          style={tw`absolute  rounded-full items-center justify-center  z-10 right-0 top-0`}
        >
          <IconButton icon="close-outline" style={tw`bg-gray-100`} size={18} />
        </ThemedView>
        <ThemedView style={tw` bg-transparent justify-between gap-4`}>
          <ThemedText type="h3" style={tw` font-bold`}>
            {product.name}
          </ThemedText>
          <ThemedText style={tw`text-base `}>${product.price}</ThemedText>
        </ThemedView>
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
    </Pressable>
  );
}
