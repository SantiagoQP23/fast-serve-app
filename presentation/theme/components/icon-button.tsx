import React from "react";
import { Pressable, ViewStyle } from "react-native";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import tw from "@/presentation/theme/lib/tailwind";
import { usePalette } from "@/presentation/theme/store/useThemeStore";

interface IconButtonProps {
  icon: IconName;
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
    outlined: "border border-primary bg-transparent",
    text: "bg-transparent",
    destructive: "bg-red-50",
  };

  const variantStyles = {
    filled: palette.onPrimary,
    secondary: palette.onSecondary,
    surface: palette.onSurfaceVariant,
    outlined: palette.text,
    text: palette.text,
    destructive: tw.color("red-600") as string,
  };

  // p-3 around the icon; grow the touch area (not the look) to Android's
  // 48dp minimum when the icon is small.
  const slop = Math.max(0, (48 - (size + 24)) / 2);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={slop}
      style={({ pressed }) => [
        tw`rounded-3xl p-2 ${pressed ? "opacity-80" : "opacity-100"} ${disabled ? "opacity-50" : ""} bg-transparent ${variantStyles[variant]} ${variants[variant]} `,
        style,
      ]}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Icon name={icon} size={size} color={variantStyles[variant]} />
    </Pressable>
  );
}
