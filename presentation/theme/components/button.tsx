import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  PressableProps,
} from "react-native";
import tw from "../lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";

export interface ButtonProps extends PressableProps {
  label?: string;
  variant?: "primary" | "secondary" | "outline" | "text";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  layout?: "horizontal" | "vertical";
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  leftIcon: icon,
  rightIcon,
  size = "medium",
  layout = "horizontal",
  icon: verticalIcon,
}: ButtonProps) {
  const isVertical = layout === "vertical";

  const baseStyle = isVertical
    ? "rounded-full justify-center items-center"
    : "rounded-3xl flex-row justify-center items-center";

  const variants = {
    primary: "bg-light-primary",
    secondary: "bg-light-secondary",
    outline: "border border-light-border bg-transparent",
    text: "bg-transparent",
  };

  const sizeStyles = {
    small: "px-4 py-2",
    medium: "px-5 py-3",
    large: "px-6 py-4",
  };

  const verticalSizeStyles = {
    small: "w-16 h-16 p-2",
    medium: "w-20 h-20 p-3",
    large: "w-24 h-24 p-4",
  };

  const horizontalIconSizes = {
    small: 18,
    medium: 20,
    large: 24,
  };

  const verticalIconSizes = {
    small: 24,
    medium: 32,
    large: 40,
  };

  const verticalTextSizes = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
  };

  const textColors = {
    primary: "text-white",
    secondary: "text-light-on-secondary",
    outline: "text-light-on-surface-variant",
    text: "text-light-primary",
  };

  const iconColors = {
    primary: "#fff",
    secondary: Colors.light.onSecondary,
    outline: Colors.light.onSurfaceVariant,
    text: Colors.light.primary,
  };

  const currentIconSize = isVertical
    ? verticalIconSizes[size]
    : horizontalIconSizes[size];

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) =>
        tw.style(
          `${baseStyle} ${variants[variant]} ${isVertical ? verticalSizeStyles[size] : sizeStyles[size]}`,
          pressed && "opacity-80",
          disabled && "opacity-50",
        )
      }
    >
      {loading ? (
        <ActivityIndicator color={iconColors[variant]} />
      ) : isVertical ? (
        <ThemedView
          style={tw`bg-transparent flex-col items-center justify-center gap-1`}
        >
          {verticalIcon && (
            <Ionicons
              name={verticalIcon}
              size={currentIconSize}
              color={iconColors[variant]}
            />
          )}
          {label && (
            <Text
              style={tw`${textColors[variant]}  ${verticalTextSizes[size]} text-center`}
            >
              {label}
            </Text>
          )}
        </ThemedView>
      ) : (
        <ThemedView style={tw`bg-transparent flex-row items-center gap-3`}>
          {icon && (
            <Ionicons
              name={icon}
              size={currentIconSize}
              color={iconColors[variant]}
              style={tw``}
            />
          )}
          {label && (
            <ThemedText style={tw`${textColors[variant]} `}>{label}</ThemedText>
          )}

          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={currentIconSize}
              color={iconColors[variant]}
              style={tw``}
            />
          )}
        </ThemedView>
      )}
    </Pressable>
  );
}
