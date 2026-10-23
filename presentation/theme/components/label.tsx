import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  PressableProps,
} from "react-native";
import tw from "../lib/tailwind";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import { typography } from "@/constants/theme";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";

export interface LabelProps extends PressableProps {
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
  color?:
    | "success"
    | "warning"
    | "error"
    | "info"
    | "default"
    | "outline"
    | "primary";
  size?: "medium" | "small";
  text: string;
}

export const labelSolidStyles: Record<
  NonNullable<LabelProps["color"]>,
  { bg: string; text: string; dot: string }
> = {
  success: {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
  },
  warning: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    dot: "bg-orange-500",
  },
  error: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  info: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  default: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  outline: {
    bg: "bg-transparent",
    text: "text-on-surface-variant",
    dot: "bg-gray-400",
  },
  primary: {
    bg: "bg-primary-container",
    text: "text-on-primary-container",
    dot: "bg-primary",
  },
};

export default function Label({
  onPress,
  disabled = false,
  leftIcon: icon,
  rightIcon,
  color = "default",
  size = "medium",
  text,
  style,
  hitSlop,
  accessibilityLabel,
}: LabelProps) {
  const iconColors = {
    success: "green-500",
    warning: "orange-400",
    error: "red-500",
    info: "blue-500",
    default: "gray-500",
    outline: "gray-500",
    primary: "primary",
  };

  const isOutline = color === "outline";
  const isSmall = size === "small";
  const solid = labelSolidStyles[color];

  const containerBg = isOutline ? "border border-border" : solid.bg;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        tw.style(
          `gap-1.5 flex-row items-center ${containerBg} ${isSmall ? "px-3 py-1" : "px-4 py-1"} rounded-sm`,
          pressed && onPress && "opacity-80",
        ),
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={isSmall ? 14 : 18}
          color={tw.color(iconColors[color])}
        />
      )}
      <ThemedText
        type={isSmall ? "small" : "body2"}
        style={[
          tw`${solid.text}`,
          { fontFamily: isOutline ? typography.semibold : typography.bold },
        ]}
      >
        {text}
      </ThemedText>
      {rightIcon && (
        <Icon
          name={rightIcon}
          size={isSmall ? 12 : 14}
          color={tw.color(iconColors[color])}
        />
      )}
    </Pressable>
  );
}
