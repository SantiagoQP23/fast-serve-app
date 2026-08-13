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
}

interface FloatingToolbarProps {
  items: ToolbarItem[];
  orientation?: "horizontal" | "vertical";
  activeBgColor?: string;
  style?: ViewStyle;
}

export default function FloatingToolbar({
  items,
  orientation = "horizontal",
  activeBgColor = tw.color("gray-200"),
  style,
}: FloatingToolbarProps) {
  const isHorizontal = orientation === "horizontal";

  return (
    <ThemedView
      style={[
        tw`bg-light-surface rounded-full shadow-sm`,
        isHorizontal
          ? tw`flex-row items-center px-2 py-2 gap-4`
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
          style={({ pressed }) => [
            tw`w-10 h-10 rounded-full items-center justify-center`,
            item.active && { backgroundColor: activeBgColor },
            pressed && !item.disabled && tw`opacity-70`,
            item.disabled && tw`opacity-40`,
          ]}
        >
          <Ionicons name={item.icon} size={22} color={Colors.light.text} />
        </Pressable>
      ))}
    </ThemedView>
  );
}
