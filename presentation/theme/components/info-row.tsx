import type { ReactNode } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";

import { typography } from "@/constants/theme";
import tw from "../lib/tailwind";
import Icon from "./icon";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

interface InfoRowProps {
  label: string;
  /** Current value; falls back to a muted `placeholder` when empty. */
  value?: string | number | null;
  placeholder?: string;
  /** Makes the row tappable and adds a trailing chevron. */
  onPress?: () => void;
  /** Control on the value line, e.g. a Switch; replaces the chevron. */
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** A muted label over its value, closed by a bottom border. */
export default function InfoRow({
  label,
  value,
  placeholder,
  onPress,
  trailing,
  style,
}: InfoRowProps) {
  const hasValue = value !== undefined && value !== null && value !== "";
  const displayValue = hasValue ? String(value) : placeholder;
  const rowStyle = [tw`gap-1 py-3 border-b border-primary`, style];

  const content = (
    <>
      <ThemedText type="small">{label}</ThemedText>
      <ThemedView style={tw`flex-row items-center gap-3`}>
        <ThemedText
          style={[
            tw`flex-1`,
            hasValue ? { fontFamily: typography.medium } : tw`text-gray-500`,
          ]}
        >
          {displayValue}
        </ThemedText>
        {trailing ??
          (onPress && (
            <Icon
              name="chevron-right"
              size={20}
              color={tw.color("text-on-surface")}
            />
          ))}
      </ThemedView>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${displayValue ?? ""}`}
        style={({ pressed }) => [...rowStyle, pressed && tw`opacity-60`]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <ThemedView
      // Grouping would hide a trailing control from screen readers.
      accessible={!trailing}
      accessibilityLabel={
        trailing ? undefined : `${label}, ${displayValue ?? ""}`
      }
      style={rowStyle}
    >
      {content}
    </ThemedView>
  );
}
