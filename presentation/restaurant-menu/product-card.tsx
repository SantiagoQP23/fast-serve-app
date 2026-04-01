import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Pressable, PressableProps } from "react-native";

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface ProductCardProps extends PressableProps {
  product: Product;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        tw` p-4 rounded-2xl bg-light-surface dark:bg-gray-800`,
        pressed && tw`opacity-80`,
      ]}
      onPress={onPress}
    >
      <ThemedView style={tw` bg-transparent gap-2 `}>
        <ThemedText type="body1" style={tw`font-bold`}>
          {product.name}
        </ThemedText>
        <ThemedText type="body2">${product.price}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}
