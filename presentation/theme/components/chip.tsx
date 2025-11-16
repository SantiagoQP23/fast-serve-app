// components/Chip.tsx
import React from "react";
import { Pressable, Text, View } from "react-native";
import tw from "../lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "./themed-text";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

export default function Chip({ label, selected, onPress, icon }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tw`flex-row items-center px-3 py-1.5 rounded-full border`,
        selected
          ? tw`bg-light-primary border-light-primary`
          : tw`bg-white border-gray-300`,
        pressed && tw`opacity-75`,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={selected ? "white" : "#4b5563"}
          style={tw`mr-2`}
        />
      )}
      <ThemedText
        type="body2"
        style={[selected ? tw`text-white font-semibold` : tw`text-gray-700`]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}
