import React from "react";
import { Pressable, ViewStyle, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "./themed-view";
import { Colors } from "@/constants/theme";

export interface ToolbarItem {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

interface FloatingToolbarProps {
  items: ToolbarItem[];
  orientation?: "horizontal" | "vertical";
  activeBgColor?: string;
  size?: number;
  style?: ViewStyle;
}

export default function FloatingToolbar({
  items,
  orientation = "horizontal",
  activeBgColor = tw.color("gray-200"),
  size = 48,
  style,
}: FloatingToolbarProps) {
  const isHorizontal = orientation === "horizontal";

  return (
    <ThemedView
      style={[
        tw`bg-light-surface rounded-full shadow-sm`,
        isHorizontal
          ? tw`flex-row items-center py-2 px-4 gap-2`
          : tw`flex-col items-center px-2 py-3`,
        // styles.shadow,
        style,
      ]}
    >
      {items.map((item, index) => (
        <Pressable
          key={index}
          onPress={item.onPress}
          disabled={item.disabled}
          accessibilityRole="button"
          accessibilityLabel={item.accessibilityLabel}
          style={({ pressed }) => [
            tw`rounded-full items-center justify-center`,
            { width: size, height: size },
            item.active && tw`bg-light-secondary`,
            pressed && !item.disabled && tw`opacity-70`,
            item.disabled && tw`opacity-40`,
          ]}
        >
          <Ionicons
            name={item.icon}
            size={Math.round(size * 0.46)}
            color={
              item.icon
                ? Colors.light.onSecondary
                : Colors.light.onSurfaceVariant
            }
          />
        </Pressable>
      ))}
    </ThemedView>
  );
}
