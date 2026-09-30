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
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "text"
    | "surface"
    | "destructive";
  size?: "extra-small" | "small" | "medium" | "large" | "extra-large";
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
  style,
}: ButtonProps) {
  const isVertical = layout === "vertical";

  const variants = {
    primary: "bg-light-primary",
    secondary: "bg-light-secondary",
    surface: "bg-light-surface",
    outline: "border border-light-border bg-transparent",
    text: "bg-transparent",
    destructive: "bg-red-100",
  };

  const sizeStyles = {
    "extra-small": "px-3 py-[6px]",
    small: "px-4 py-[10px]",
    medium: "px-6 py-4",
    large: "px-12 py-8",
    "extra-large": "px-16 py-12",
  };

  const verticalSizeStyles = {
    "extra-small": "w-12 h-12 p-1",
    small: "w-16 h-16 p-2",
    medium: "w-20 h-20 p-3",
    large: "w-24 h-24 p-4",
    "extra-large": "w-28 h-28 p-5",
  };

  const horizontalIconSizes = {
    "extra-small": 16,
    small: 18,
    medium: 20,
    large: 24,
    "extra-large": 28,
  };

  const verticalIconSizes = {
    "extra-small": 16,
    small: 24,
    medium: 32,
    large: 40,
    "extra-large": 48,
  };

  const textSizes = {
    "extra-small": "text-sm",
    small: "text-sm",
    medium: "text-base",
    large: "text-2xl",
    "extra-large": "text-[32px]",
  };

  const textColors = {
    primary: "text-white",
    secondary: "text-light-on-secondary",
    outline: "text-light-on-surface-variant",
    text: "text-light-primary",
    surface: "text-light-on-surface-variant",
    destructive: "text-red-800",
  };

  const iconColors = {
    primary: "#fff",
    secondary: Colors.light.onSecondary,
    outline: Colors.light.onSurfaceVariant,
    text: Colors.light.primary,
    surface: Colors.light.onSurfaceVariant,
    destructive: tw.color("red-900"),
  };

  const currentIconSize = isVertical
    ? verticalIconSizes[size]
    : horizontalIconSizes[size];

  if (isVertical) {
    return (
      <Pressable
        disabled={disabled || loading}
        onPress={onPress}
        style={({ pressed }) => [
          tw.style(
            "items-center gap-1.5",
            pressed && "opacity-80",
            disabled && "opacity-50",
          ),
          { ...style },
        ]}
      >
        <ThemedView
          style={tw.style(
            `rounded-full items-center justify-center ${variants[variant]} ${verticalSizeStyles[size]}`,
          )}
        >
          {loading ? (
            <ActivityIndicator color={iconColors[variant]} />
          ) : (
            verticalIcon && (
              <Ionicons
                name={verticalIcon}
                size={currentIconSize}
                color={iconColors[variant]}
              />
            )
          )}
        </ThemedView>
        {label && (
          <Text
            style={tw`${textColors[variant]} ${textSizes[size]} text-center`}
          >
            {label}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        tw.style(
          `rounded-3xl flex-row justify-center items-center ${variants[variant]} ${sizeStyles[size]} `,
          pressed && "opacity-80",
          disabled && "opacity-50",
        ),
        { ...style },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={iconColors[variant]} />
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
            <ThemedText style={tw`${textColors[variant]} ${textSizes[size]}`}>
              {label}
            </ThemedText>
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
