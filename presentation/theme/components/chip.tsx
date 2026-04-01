// components/Chip.tsx
import React from "react";
import { Pressable, Text, View } from "react-native";
import tw from "../lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "./themed-text";

type ChipProps = {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  rightContent?: React.ReactNode;
  leftContent?: React.ReactNode;
};

export default function Chip({
  label,
  selected,
  onPress,
  icon,
  rightContent,
  leftContent,
  disabled,
}: ChipProps) {
  return (
    <Pressable
      onPress={() => !disabled && onPress && onPress()}
      style={({ pressed }) => [
        tw`flex-row items-center px-3 py-1.5 rounded-full border gap-2`,
        selected
          ? tw`bg-light-primary border-light-primary`
          : tw`bg-white border-gray-200`,
        pressed && tw`opacity-75`,
        disabled && tw`opacity-50`,
      ]}
    >
      {leftContent && leftContent}
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={selected ? "white" : "#4b5563"}
        />
      )}
      <ThemedText
        type="body2"
        style={[selected ? tw`text-white font-semibold` : tw``]}
      >
        {label}
      </ThemedText>
      {rightContent && rightContent}
    </Pressable>
  );
}
