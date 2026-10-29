import type { ReactNode } from "react";
import { View } from "react-native";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";

const LIST_PANE_WIDTH = 440;

interface InventorySplitLayoutProps {
  list: ReactNode;
  /** Detail shown next to the list; null shows the empty hint. */
  pane: ReactNode | null;
  emptyIcon: IconName;
  emptyText: string;
}

/**
 * Tablet landscape: the list on the left and the selected detail in a pane
 * next to it, instead of pushing a screen.
 */
export default function InventorySplitLayout({
  list,
  pane,
  emptyIcon,
  emptyText,
}: InventorySplitLayoutProps) {
  return (
    <ThemedView style={tw`flex-1 flex-row bg-transparent`}>
      <View style={{ width: LIST_PANE_WIDTH }}>{list}</View>
      <ThemedView style={tw`flex-1 border-l border-outline-variant`}>
        {pane ?? (
          <ThemedView style={tw`flex-1 items-center justify-center gap-4 px-8`}>
            <Icon name={emptyIcon} size={64} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={tw`text-center text-gray-500`}>
              {emptyText}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ThemedView>
  );
}
