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

export interface ButtonProps extends PressableProps {
  label?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
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
  style,
}: ButtonProps) {
  const baseStyle = " rounded-2xl flex-row justify-center items-center";

  const variants = {
    primary: "bg-light-primary",
    secondary: "bg-light-secondary",
    outline: "border border-light-primary bg-transparent",
  };

  const sizeStyles = {
    small: "px-3 py-2",
    medium: "px-5 py-3",
    large: "px-6 py-4",
  };

  const textColors = {
    primary: "text-white",
    secondary: "text-white",
    outline: "text-light-primary",
  };

  const iconColors = {
    primary: "#fff",
    secondary: "#fff",
    outline: Colors.light.primary,
  };

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        tw.style(
          `${baseStyle} ${variants[variant]} ${sizeStyles[size]}`,
          pressed && "opacity-80",
          disabled && "opacity-50",
        ),
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <ThemedView style={tw`bg-transparent flex-row items-center gap-3`}>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={iconColors[variant]}
              style={tw``}
            />
          )}
          {label && (
            <Text style={tw`${textColors[variant]} font-semibold text-base `}>
              {label}
            </Text>
          )}

          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={20}
              color={iconColors[variant]}
              style={tw``}
            />
          )}
        </ThemedView>
      )}
    </Pressable>
  );
}
