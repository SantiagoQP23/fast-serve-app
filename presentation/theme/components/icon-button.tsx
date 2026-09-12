import React from "react";
import { Pressable, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";

import { Colors } from "@/constants/theme";

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
  variant?: "filled" | "secondary" | "outlined" | "text" | "destructive";
}

export default function IconButton({
  icon,
  size = 18,
  onPress,
  disabled = false,
  style,
  variant = "text",
}: IconButtonProps) {
  const variants = {
    filled: "bg-light-primary",
    secondary: "bg-light-secondary",
    outlined: "border border-light-border bg-transparent",
    text: "bg-transparent",
    destructive: "bg-red-50",
  };

  const variantStyles = {
    filled: "#ffffff",
    secondary: Colors.light.onSecondary,
    outlined: Colors.light.onSurfaceVariant,
    text: Colors.light.primary,
    destructive: tw.color("red-600") as string,
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tw`rounded-3xl p-2 ${pressed ? "opacity-80" : "opacity-100"} ${disabled ? "opacity-50" : ""} bg-transparent ${variantStyles[variant]} ${variants[variant]} `,
        style,
      ]}
      disabled={disabled}
    >
      <Ionicons name={icon} size={size} color={variantStyles[variant]} />
    </Pressable>
  );
}
