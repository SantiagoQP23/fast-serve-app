import React, { useState } from "react";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { View, Pressable, PressableProps } from "react-native";
import IconButton from "@/presentation/theme/components/icon-button";

interface BillCardProps extends PressableProps {
  bill: { id: string };
}

export default function BillCard({ onPress }: BillCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        tw`mb-3 p-4 rounded-2xl bg-gray-100 dark:bg-gray-800`,
        pressed && tw`opacity-80`,
      ]}
      onPress={onPress}
    >
      <ThemedView style={tw` bg-transparent gap-2`}>
        <ThemedView style={tw`flex-row bg-transparent justify-between gap-2`}>
          <ThemedText type="body1" style={tw`font-bold`}>
            Bill #1234
          </ThemedText>
          <ThemedText type="body2">Not paid</ThemedText>
        </ThemedView>
        <ThemedView
          style={tw` flex-row justify-between bg-transparent items-center `}
        >
          <ThemedText type="body2">Today, 10:30</ThemedText>
          <ThemedText type="h3">${30}</ThemedText>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}
