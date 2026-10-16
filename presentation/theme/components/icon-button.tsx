import React from "react";
import { Pressable, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { usePalette } from "@/presentation/theme/store/useThemeStore";


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
  variant?:
    | "filled"
    | "secondary"
    | "surface"
    | "outlined"
    | "text"
    | "destructive";
  accessibilityLabel?: string;
}

export default function IconButton({
  icon,
  size = 18,
  onPress,
  disabled = false,
  style,
  variant = "text",
  accessibilityLabel,
}: IconButtonProps) {
  const palette = usePalette();
  const variants = {
    filled: "bg-primary",
    secondary: "bg-secondary",
    surface: "bg-surface",
    outlined: "border border-border bg-transparent",
    text: "bg-transparent",
    destructive: "bg-red-50",
  };

  const variantStyles = {
    filled: palette.onPrimary,
    secondary: palette.onSecondary,
    surface: palette.onSurfaceVariant,
    outlined: palette.onSurfaceVariant,
    text: palette.onSurfaceVariant,
    destructive: tw.color("red-600") as string,
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tw`rounded-3xl p-3 ${pressed ? "opacity-80" : "opacity-100"} ${disabled ? "opacity-50" : ""} bg-transparent ${variantStyles[variant]} ${variants[variant]} `,
        style,
      ]}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={size} color={variantStyles[variant]} />
    </Pressable>
  );
}
