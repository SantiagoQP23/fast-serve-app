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

// Visual style, independent of the M3 type above. "surface" matches Button's
// surface variant: filled with the surface color, no outline.
export type ChipAppearance = "outline" | "surface";

type ChipProps = {
  label: string;
  variant?: ChipVariant;
  appearance?: ChipAppearance;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  /** Secondary action, e.g. editing the item the chip stands for. */
  onLongPress?: () => void;
  /** Read after the label, e.g. to announce what a long press does. */
  accessibilityHint?: string;
  onRemove?: () => void;
  icon?: IconName;
  /** False drops the selected check, e.g. in a narrow rail where the fill says it. */
  showSelectedCheck?: boolean;
  rightContent?: React.ReactNode;
  leftContent?: React.ReactNode;
};

export default function Chip({
  label,
  variant = "filter",
  appearance = "outline",
  selected,
  onPress,
  onLongPress,
  accessibilityHint,
  onRemove,
  icon,
  showSelectedCheck = true,
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
  const resolvedIcon =
    icon ?? (filled && showSelectedCheck && !leftContent ? "check" : undefined);

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
      onLongPress={onLongPress && !disabled ? onLongPress : undefined}
      accessibilityHint={accessibilityHint}
      // ~32dp tall; extend the touch area to 48dp without changing the look.
      hitSlop={{ top: 8, bottom: 8 }}
      accessibilityRole="button"
      accessibilityState={{
        disabled: !!disabled,
        ...(variant === "filter" && { selected: !!selected }),
      }}
      style={({ pressed }) => [
        tw`flex-row items-center px-4 py-[6px] rounded-lg gap-2`,
        filled
          ? tw`bg-secondary`
          : appearance === "surface"
            ? // Transparent border keeps the same height as an outline chip.
              tw`bg-surface border border-transparent`
            : tw`border border-primary`,
        pressed && tw`opacity-75`,
        disabled && tw`opacity-50`,
      ]}
    >
      {leftContent}
      {resolvedIcon && <Icon name={resolvedIcon} size={16} color={iconColor} />}
      <ThemedText
        type="body2"
        // Shrinks and wraps in a narrow column instead of pushing out
        // trailing content
        style={[
          tw`text-on-surface flex-shrink`,
          { fontFamily: typography.medium },
        ]}
      >
        {label}
      </ThemedText>
      {trailingContent}
    </Pressable>
  );
}
