import type { ReactNode } from "react";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";

interface InventorySectionHeaderProps {
  title: string;
  count: number;
  /** Tints the count for the group that still needs attention. */
  highlight?: boolean;
  /** One line of guidance under the title. */
  hint?: string;
  /** A small action at the end of the title row, e.g. an add button. */
  right?: ReactNode;
}

/** Group title with its size, like the order screen's "pending items" header. */
export default function InventorySectionHeader({
  title,
  count,
  highlight,
  hint,
  right,
}: InventorySectionHeaderProps) {
  return (
    <ThemedView style={tw`gap-1 bg-transparent`}>
      <ThemedView style={tw`flex-row items-center gap-2 bg-transparent`}>
        <ThemedView
          accessibilityRole="header"
          style={tw`flex-1 flex-row items-center gap-2 bg-transparent`}
        >
          <ThemedText
            type="body2"
            style={[tw`text-gray-500`, { fontFamily: typography.semibold }]}
          >
            {title}
          </ThemedText>
          <ThemedView
            style={tw.style(
              "px-2.5 py-1 rounded-full",
              highlight ? "bg-primary-50" : "bg-gray-100",
            )}
          >
            <ThemedText
              type="small"
              style={tw.style(
                "font-semibold",
                highlight ? "text-primary-700" : "text-gray-600",
              )}
            >
              {count}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        {right}
      </ThemedView>
      {hint && (
        <ThemedText type="small" style={tw`text-gray-500`}>
          {hint}
        </ThemedText>
      )}
    </ThemedView>
  );
}
