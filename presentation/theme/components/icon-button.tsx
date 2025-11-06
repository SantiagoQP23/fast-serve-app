import React from "react";
import { Pressable, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
  backgroundColor?: string;
}

export default function IconButton({
  icon,
  size = 22,
  color = "#1f2937", // gray-800
  onPress,
  style,
  backgroundColor = "#f3f4f6", // gray-100
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tw`rounded-full p-3`,
        { backgroundColor: pressed ? "#e5e7eb" : backgroundColor },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}
