// components/Switch.tsx
import { Colors } from "@/constants/theme";
import React from "react";
import { Switch as RNSwitch } from "react-native";
import tw from "twrnc";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";

type SwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
};

export default function Switch({
  value,
  onValueChange,
  label,
  disabled = false,
}: SwitchProps) {
  return (
    <ThemedView style={tw`flex-row items-center justify-between w-full `}>
      {label && (
        <ThemedText style={tw`font-semibold`} type="body2">
          {label}
        </ThemedText>
      )}
      <RNSwitch
        trackColor={{ false: "#d1d5db", true: Colors.light.primary }} // gray-300 / blue-500
        thumbColor={value ? "#fff" : "#f4f3f4"}
        ios_backgroundColor="#d1d5db"
        onValueChange={onValueChange}
        value={value}
        disabled={disabled}
      />
    </ThemedView>
  );
}
