import React from "react";
import tw from "@/presentation/theme/lib/tailwind";
import { Pressable, PressableProps } from "react-native";

export default function Card({ onPress, children }: PressableProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        tw` p-4 rounded-2xl  dark:border-gray-700 bg-white dark:bg-gray-900 bg-gray-100`,
        pressed && tw`opacity-80`,
      ]}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}
