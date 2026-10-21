// components/Chip.tsx
import React from "react";
import { Pressable } from "react-native";
import tw from "../lib/tailwind";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import { ThemedText } from "./themed-text";
import { typography } from "@/constants/theme";
import { usePalette } from "@/presentation/theme/store/useThemeStore";

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
  icon?: IconName;
  rightContent?: React.ReactNode;
  leftContent?: React.ReactNode;
};

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
  const palette = usePalette();

  const iconColor = filled
    ? palette.onSecondary
    : variant === "assist"
      ? palette.primary
      : tw.color("gray-600");

  // When filled and nothing else occupies the leading slot, show the M3
  // selected-state checkmark. An explicit `icon` always wins (e.g. a "close"
  // icon on an applied-filter chip means remove, not re-confirm selection).
  const resolvedIcon = icon ?? (filled && !leftContent ? "check" : undefined);

  const trailingContent =
    rightContent ??
    (variant === "input" && onRemove ? (
      <Pressable onPress={onRemove} disabled={disabled} hitSlop={8}>
        <Icon name="x" size={16} color={iconColor} />
      </Pressable>
    ) : null);

  return (
    <Pressable
      onPress={() => !disabled && onPress && onPress()}
      accessibilityRole="button"
      accessibilityState={{
        disabled: !!disabled,
        ...(variant === "filter" && { selected: !!selected }),
      }}
      style={({ pressed }) => [
        tw`flex-row items-center px-4 py-[6px] rounded-md gap-2`,
        filled
          ? tw`bg-secondary`
          : variant === "input"
            ? tw`bg-surface-container-low border border-primary`
            : tw`border border-primary`,
        pressed && tw`opacity-75`,
        disabled && tw`opacity-50`,
      ]}
    >
      {leftContent}
      {resolvedIcon && <Icon name={resolvedIcon} size={16} color={iconColor} />}
      <ThemedText
        type="body2"
        style={[tw`text-primary`, { fontFamily: typography.medium }]}
      >
        {label}
      </ThemedText>
      {trailingContent}
    </Pressable>
  );
}
