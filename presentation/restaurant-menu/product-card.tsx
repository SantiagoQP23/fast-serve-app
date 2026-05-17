import { Product } from "@/core/menu/models/product.model";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Pressable, PressableProps } from "react-native";

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
        <ThemedText type="body1" style={tw``}>
          {product.name}
        </ThemedText>
        <ThemedText type="body1" style={tw`text-gray-600`}>
          {product.options.length > 1
            ? product.options.map((option) => option.name).join(" - ")
            : product.options[0]
              ? `$${product.options[0].price}`
              : "No options available"}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}
