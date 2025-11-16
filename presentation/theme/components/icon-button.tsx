import React from "react";
import { Pressable, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "info"
    | string;
  onPress?: () => void;
  style?: ViewStyle;
  backgroundColor?: string;
  disabled?: boolean;
}

export default function IconButton({
  icon,
  size = 22,
  color = "primary", // gray-800
  onPress,
  disabled = false,
  style,
  backgroundColor = "transparent", // gray-100
}: IconButtonProps) {
  const colors: { [key: string]: string } = {
    primary: "#1f2937", // gray-800
    secondary: "#6b7280", // gray-500
    success: "#10b981", // green-500
    danger: "#ef4444", // red-500
    warning: "#f59e0b", // yellow-500
    info: "#3b82f6", // blue-500
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tw`rounded-full p-1 ${pressed ? "opacity-80" : "opacity-100"} ${disabled ? "opacity-50" : ""} bg-transparent`,
        {
          // backgroundColor: !pressed
          //   ? backgroundColor
          //   : !disabled
          //     ? "#e5e7eb"
          //     : backgroundColor,
          backgroundColor: backgroundColor,
        },
        style,
      ]}
      disabled={disabled}
    >
      <Ionicons name={icon} size={size} color={colors[color] || color} />
    </Pressable>
  );
}
