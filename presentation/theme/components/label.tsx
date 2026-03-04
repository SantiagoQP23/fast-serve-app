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

export interface LabelProps extends PressableProps {
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  color?: "success" | "warning" | "error" | "info" | "default";
  text: string;
}

export default function Label({
  label,
  onPress,
  loading = false,
  disabled = false,
  leftIcon: icon,
  rightIcon,
  color = "info",
  text,
  style,
}: LabelProps) {
  const baseStyle = " rounded-xl flex-row justify-center items-center";

  const variants = {
    primary: "bg-light-primary",
    secondary: "bg-gray-100",
    outline: "border border-gray-200 bg-transparent",
  };

  const bgColors = {
    success: "bg-green-500",
    warning: "bg-orange-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    default: "bg-gray-500",
  };

  const textColors = {
    success: "text-green-600",
    warning: "text-orange-500",
    error: "text-red-600",
    info: "text-blue-600",
    default: "text-gray-600",
  };

  const iconColors = {
    success: "green-500",
    warning: "orange-400",
    error: "red-500",
    info: "blue-500",
    default: "gray-500",
  };

  return (
    <ThemedView
      style={tw`gap-1 flex-row items-center ${bgColors[color]}/10 px-3 py-1 rounded-full`}
    >
      {icon && (
        <Ionicons name={icon} size={18} color={tw.color(iconColors[color])} />
      )}
      <ThemedText type="body2" style={tw`${textColors[color]} font-semibold`}>
        {text}
      </ThemedText>
    </ThemedView>
  );
}
