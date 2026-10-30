import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import tw from "../lib/tailwind";
import { typography } from "@/constants/theme";
import Card from "./card";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

/** Outlined card that groups related rows on a detail screen. */
export function DetailCard({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <Card variant="default" style={[tw`px-5`, style]}>
      {children}
    </Card>
  );
}

/** Bold heading above a section's card, its action on the right. */
export function DetailSectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <ThemedView style={tw`flex-row items-center justify-between gap-3 min-h-8`}>
      <ThemedText
        type="h4"
        accessibilityRole="header"
        style={[tw`flex-1`, { fontFamily: typography.bold }]}
      >
        {title}
      </ThemedText>
      {action}
    </ThemedView>
  );
}

/** Quiet heading inside a card. */
export function DetailCardTitle({ title }: { title: string }) {
  return (
    <ThemedText accessibilityRole="header" style={tw`text-gray-500`}>
      {title}
    </ThemedText>
  );
}

/**
 * Label on the left, value on the right. Values are selectable so a
 * reference can be copied; `children` replaces the value (e.g. a Label) and
 * `trailing` holds a row action.
 */
export function DetailCardRow({
  label,
  value,
  trailing,
  children,
}: {
  label: string;
  value?: string;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <ThemedView
      // Grouping would hide a trailing control from screen readers.
      accessible={!trailing && value != null}
      accessibilityLabel={
        !trailing && value != null ? `${label}, ${value}` : undefined
      }
      style={tw`flex-row items-center gap-4 min-h-14 py-2`}
    >
      <ThemedText style={tw`text-gray-500`}>{label}</ThemedText>
      <ThemedView style={tw`flex-1 flex-row items-center justify-end gap-2`}>
        {children ?? (
          <ThemedText selectable style={tw`flex-shrink text-right`}>
            {value}
          </ThemedText>
        )}
        {trailing}
      </ThemedView>
    </ThemedView>
  );
}
