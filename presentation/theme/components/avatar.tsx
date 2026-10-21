import React from "react";
import { Pressable, ViewStyle } from "react-native";
import tw from "../lib/tailwind";
import { typography } from "@/constants/theme";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";
import { usePalette } from "@/presentation/theme/store/useThemeStore";

type AvatarVariant = "dynamic" | "primary" | "outlined" | "surface";

export interface AvatarProps {
  name?: string;
  /**
   * `dynamic` colors by initial; `primary` fills with the theme's primary
   * color; `outlined` draws a primary border on a transparent background;
   * `surface` is a quiet surface-tinted fill with primary initials, like the
   * Button's surface variant.
   */
  variant?: AvatarVariant;
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

export default function Avatar({
  name,
  variant = "dynamic",
  size = 40,
  style,
  onPress,
}: AvatarProps) {
  const palette = usePalette();
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "?";
  const isOutlined = variant === "outlined";
  const isSurface = variant === "surface";
  const isPrimary =
    variant === "primary" || (variant === "dynamic" && initial === "?");
  const backgroundColor = isOutlined
    ? "transparent"
    : isSurface
      ? palette.surface
      : isPrimary
        ? palette.primary
        : getAvatarColor(initial);
  // Primary flips to ivory in dark themes, so pair it with its own on-color.
  const textColor =
    isOutlined || isSurface
      ? palette.primary
      : isPrimary
        ? palette.onPrimary
        : "#FFFFFF";

  const content = (
    <ThemedView
      style={[
        tw`items-center justify-center`,
        // Explicit radius: Android can draw `rounded-full` + border as a square.
        { width: size, height: size, borderRadius: size / 2, backgroundColor },
        isOutlined && { borderWidth: 1.5, borderColor: palette.primary },
        style,
      ]}
    >
      <ThemedText
        style={[
          {
            color: textColor,
            fontFamily: typography.semibold,
            fontSize: size * 0.45,
          },
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
