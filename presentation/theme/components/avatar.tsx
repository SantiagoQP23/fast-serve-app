import React from "react";
import { Pressable, ViewStyle } from "react-native";
import tw from "../lib/tailwind";
import { typography, Colors } from "@/constants/theme";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";

export interface AvatarProps {
  name?: string;
  size?: number;
  style?: ViewStyle;
  onPress?: () => void;
}

// Deterministic palette so the same starting letter always maps to the same color.
const AVATAR_COLORS = [
  "#C0392B", // red
  "#AD1457", // pink
  "#8E44AD", // purple
  "#34495E", // slate blue
  "#2E6DA4", // blue
  "#16817A", // teal
  "#3F7D3F", // green
  "#A8710A", // gold
  "#BF5B22", // orange
  "#6D4C41", // brown
];

function getAvatarColor(initial: string): string {
  return AVATAR_COLORS[initial.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function Avatar({ name, size = 40, style, onPress }: AvatarProps) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "?";
  const backgroundColor =
    initial === "?" ? Colors.light.primary : getAvatarColor(initial);

  const content = (
    <ThemedView
      style={[
        tw`items-center justify-center rounded-full`,
        { width: size, height: size, backgroundColor },
        style,
      ]}
    >
      <ThemedText
        style={[
          tw`text-white`,
          { fontFamily: typography.semibold, fontSize: size * 0.45 },
        ]}
      >
        {initial}
      </ThemedText>
    </ThemedView>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => tw.style(pressed && "opacity-80")}
    >
      {content}
    </Pressable>
  );
}
