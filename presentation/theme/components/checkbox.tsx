import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import tw from "../lib/tailwind";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

type CheckboxProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  error?: string;
  size?: "small" | "medium" | "large";
};

export default function Checkbox({
  value,
  onValueChange,
  label,
  disabled = false,
  error,
  size = "medium",
}: CheckboxProps) {
  const sizeStyles = {
    small: { box: 20, icon: 14 },
    medium: { box: 24, icon: 18 },
    large: { box: 28, icon: 22 },
  };

  const checkboxSize = sizeStyles[size];

  const CheckboxBox = () => (
    <Pressable
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [
        tw.style(
          "justify-center items-center border-2 rounded-lg",
          value
            ? "bg-light-primary border-light-primary"
            : "bg-white border-gray-300",
          pressed && !disabled && "opacity-80",
          disabled && "opacity-50",
          error && !value && "border-red-500",
        ),
        {
          width: checkboxSize.box,
          height: checkboxSize.box,
        },
      ]}
    >
      {value && (
        <Ionicons name="checkmark" size={checkboxSize.icon} color="#fff" />
      )}
    </Pressable>
  );

  // If no label, return just the checkbox
  if (!label) {
    return (
      <View>
        <CheckboxBox />
        {error && (
          <ThemedText style={tw`text-red-500 text-sm mt-1`}>
            {error}
          </ThemedText>
        )}
      </View>
    );
  }

  // With label, return full component
  return (
    <ThemedView style={tw`w-full`}>
      <Pressable
        disabled={disabled}
        onPress={() => onValueChange(!value)}
        style={({ pressed }) => [
          tw.style(
            "flex-row items-center gap-3",
            pressed && !disabled && "opacity-80",
          ),
        ]}
      >
        <CheckboxBox />
        <ThemedText
          type="body2"
          style={tw.style("font-semibold flex-1", disabled && "opacity-50")}
        >
          {label}
        </ThemedText>
      </Pressable>
      {error && (
        <ThemedText style={tw`text-red-500 text-sm mt-1 ml-9`}>
          {error}
        </ThemedText>
      )}
    </ThemedView>
  );
}
