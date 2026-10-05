// components/Chip.tsx
import React from "react";
import { Pressable } from "react-native";
import tw from "../lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "./themed-text";
import { typography } from "@/constants/theme";

// Material Design 3 chip types. "filter" (toggle selection, e.g. category/status
// tabs) is the default and matches this component's original, only behavior.
// "assist" triggers a one-off action and never shows a selected/filled state.
// "input" represents user-entered data (tags, attachments) and supports a
// trailing remove affordance via `onRemove`. "suggestion" is a lightweight,
// label-only tap-to-choose chip.
export type ChipVariant = "filter" | "assist" | "input" | "suggestion";

type ChipProps = {
  label: string;
  variant?: ChipVariant;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  rightContent?: React.ReactNode;
  leftContent?: React.ReactNode;
};

// Mirrors Colors.light.onSecondary / .primary (constants/theme.ts) — kept as
// literals here since Ionicons' `color` prop needs a raw value, not a tw class.
const SELECTED_ICON_COLOR = "#3C4858";
const DEFAULT_ICON_COLOR = "#4b5563";
const ASSIST_ICON_COLOR = "#38608F";

export default function Chip({
  label,
  variant = "filter",
  selected,
  onPress,
  onRemove,
  icon,
  rightContent,
  leftContent,
  disabled,
}: ChipProps) {
  // Assist chips represent a one-off action, not a toggle, so they never fill.
  const filled = variant !== "assist" && selected;

  const iconColor = filled
    ? SELECTED_ICON_COLOR
    : variant === "assist"
      ? ASSIST_ICON_COLOR
      : DEFAULT_ICON_COLOR;

  // When filled and nothing else occupies the leading slot, show the M3
  // selected-state checkmark. An explicit `icon` always wins (e.g. a "close"
  // icon on an applied-filter chip means remove, not re-confirm selection).
  const resolvedIcon =
    icon ?? (filled && !leftContent ? "checkmark" : undefined);

  const trailingContent =
    rightContent ??
    (variant === "input" && onRemove ? (
      <Pressable onPress={onRemove} disabled={disabled} hitSlop={8}>
        <Ionicons name="close" size={16} color={iconColor} />
      </Pressable>
    ) : null);

  return (
    <Pressable
      onPress={() => !disabled && onPress && onPress()}
      style={({ pressed }) => [
        tw`flex-row items-center px-4 py-[6px] rounded-full gap-2`,
        filled
          ? tw`bg-light-secondary`
          : variant === "input"
            ? tw`bg-light-surface-container-low border border-light-border`
            : tw`border border-light-border`,
        pressed && tw`opacity-75`,
        disabled && tw`opacity-50`,
      ]}
    >
      {leftContent}
      {resolvedIcon && (
        <Ionicons name={resolvedIcon} size={16} color={iconColor} />
      )}
      <ThemedText
        type="body2"
        style={[
          filled
            ? tw`text-light-on-secondary`
            : variant === "assist"
              ? tw`text-light-text`
              : tw`text-light-on-surface-variant`,
          { fontFamily: typography.medium },
        ]}
      >
        {label}
      </ThemedText>
      {trailingContent}
    </Pressable>
  );
}
