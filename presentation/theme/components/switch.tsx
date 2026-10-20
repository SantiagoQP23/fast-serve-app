// components/Switch.tsx
import { typography } from "@/constants/theme";
import React from "react";
import { Switch as RNSwitch } from "react-native";
import tw from "../lib/tailwind";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";
import { usePalette } from "@/presentation/theme/store/useThemeStore";

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
  const palette = usePalette();
  return (
    <ThemedView style={tw`flex-row items-center justify-between w-full `}>
      {label && (
        <ThemedText style={{ fontFamily: typography.medium }} type="body1">
          {label}
        </ThemedText>
      )}
      <RNSwitch
        trackColor={{ false: tw.color("gray-300"), true: palette.primary }}
        thumbColor={value ? palette.onPrimary : "#f4f3f4"}
        ios_backgroundColor={tw.color("gray-300")}
        onValueChange={onValueChange}
        value={value}
        disabled={disabled}
      />
    </ThemedView>
  );
}
