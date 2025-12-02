import React from "react";
import tw from "@/presentation/theme/lib/tailwind";
import { Pressable, PressableProps } from "react-native";
import { ThemedView } from "./themed-view";

export default function Card({ onPress, children }: PressableProps) {
  return (
    <ThemedView style={tw`shadow-sm rounded-2xl`}>
      <Pressable
        style={({ pressed }) => [
          tw` p-4 rounded-2xl border border-gray-300   `,
          pressed && tw`opacity-80`,
        ]}
        onPress={onPress}
      >
        {children}
      </Pressable>
    </ThemedView>
  );
}
