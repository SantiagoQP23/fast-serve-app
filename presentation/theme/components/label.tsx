import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  PressableProps,
} from "react-native";
import tw from "../lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { Colors, typography } from "@/constants/theme";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";

export interface LabelProps extends PressableProps {
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  color?:
    | "success"
    | "warning"
    | "error"
    | "info"
    | "default"
    | "outline"
    | "primary";
  /** "soft" (default) is a tinted fill; "solid" is the pastel badge treatment with a leading status dot. */
  variant?: "soft" | "solid";
  size?: "medium" | "small";
  text: string;
}

export default function Label({
  onPress,
  disabled = false,
  leftIcon: icon,
  color = "default",
  variant = "soft",
  size = "medium",
  text,
  style,
}: LabelProps) {
  const baseStyle = " rounded-xl flex-row justify-center items-center";

  const variants = {
    primary: "bg-light-primary",
    secondary: "bg-gray-100",
    outline: "border border-gray-200 bg-transparent",
  };

  const solidStyles = {
    success: { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
    warning: { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500" },
    error: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
    info: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
    default: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
    outline: {
      bg: "bg-transparent",
      text: "text-light-on-surface-variant",
      dot: "bg-gray-400",
    },
    primary: {
      bg: "bg-light-primary-container",
      text: "text-light-on-primary-container",
      dot: "bg-light-primary",
    },
  };

  const bgColors = {
    success: "bg-green-500",
    warning: "bg-orange-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    default: "bg-gray-500",
    outline: "bg-transparent",
    primary: "bg-white",
  };

  const textColors = {
    success: "text-green-600",
    warning: "text-orange-500",
    error: "text-red-600",
    info: "text-blue-600",
    default: "text-gray-600",
    outline: "text-light-on-surface-variant",
    primary: "text-light-primary",
  };

  const iconColors = {
    success: "green-500",
    warning: "orange-400",
    error: "red-500",
    info: "blue-500",
    default: "gray-500",
    outline: "gray-500",
    primary: "light-primary",
  };

  const isOutline = color === "outline";
  const isSmall = size === "small";
  const isSolid = variant === "solid" && !isOutline;
  const solid = solidStyles[color];
  const showDot = isSolid && !icon;

  const containerBg = isOutline
    ? "border border-light-border"
    : isSolid
      ? solid.bg
      : `${bgColors[color]}/10`;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        tw.style(
          `gap-1.5 flex-row items-center ${containerBg} ${isSmall ? "px-3 py-1" : "px-4 py-1"} rounded-full`,
          pressed && onPress && "opacity-80",
        ),
      ]}
    >
      {showDot && (
        <ThemedView style={tw.style("w-1.5 h-1.5 rounded-full", solid.dot)} />
      )}
      {icon && (
        <Ionicons
          name={icon}
          size={isSmall ? 14 : 18}
          color={tw.color(iconColors[color])}
        />
      )}
      <ThemedText
        type={isSmall ? "small" : "body2"}
        style={[
          tw`${isSolid ? solid.text : textColors[color]} `,
          { fontFamily: isSolid ? typography.bold : typography.semibold },
        ]}
      >
        {text}
      </ThemedText>
    </Pressable>
  );
}
