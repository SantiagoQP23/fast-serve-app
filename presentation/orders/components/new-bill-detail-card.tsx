import React, { useState } from "react";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { View, Pressable, PressableProps } from "react-native";
import IconButton from "@/presentation/theme/components/icon-button";

interface NewBillDetailCardProps extends PressableProps {}

export default function NewBillDetailCard({ onPress }: NewBillDetailCardProps) {
  const [counter, setCounter] = useState(1);
  return (
    <Pressable
      style={({ pressed }) => [
        tw`mb-3 p-4 rounded-2xl bg-gray-100 dark:bg-gray-800`,
        pressed && tw`opacity-80`,
      ]}
      onPress={onPress}
    >
      <ThemedView style={tw`flex-row justify-between items-end bg-transparent`}>
        <ThemedView style={tw` bg-transparent justify-between gap-1`}>
          <ThemedText type="h3" style={tw` font-bold`}>
            Arroz marinero x3
          </ThemedText>
          <ThemedText type="body2">5 en total</ThemedText>
          <ThemedText style={tw`text-base `}>$10</ThemedText>
        </ThemedView>
        <ThemedView style={tw`flex-row items-center gap-2 bg-transparent`}>
          <IconButton
            icon="remove-outline"
            onPress={() => setCounter((value) => value - 1)}
          />
          <ThemedText>{counter}</ThemedText>
          <IconButton
            icon="add"
            onPress={() => setCounter((value) => value + 1)}
          />
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}
