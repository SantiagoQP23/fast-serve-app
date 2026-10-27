import { useRef, type ReactNode } from "react";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import InfoBottomSheet from "@/presentation/theme/components/info-bottom-sheet";
import tw from "@/presentation/theme/lib/tailwind";

interface ProductSectionHeaderProps {
  title: string;
  /** Shown in an info sheet behind an icon button next to the title. */
  hint?: string;
  hintLabel?: string;
  /** Shows the add button when given: a trailing "+", or labeled below the
   * title while the section is `empty`. */
  onAdd?: () => void;
  addLabel?: string;
  empty?: boolean;
  /** Any other action at the end of the row, e.g. an options button. */
  right?: ReactNode;
}

/**
 * Header shared by the sections of the product detail (variants, tags):
 * title with an optional info button for its hint, and an outline "+"
 * button on the right — labeled, under the title, while the list is empty.
 */
export default function ProductSectionHeader({
  title,
  hint,
  hintLabel,
  onAdd,
  addLabel,
  empty,
  right,
}: ProductSectionHeaderProps) {
  const hintSheetRef = useRef<BottomSheetMethods>(null);

  return (
    <ThemedView style={tw`gap-3 bg-transparent`}>
      <ThemedView style={tw`flex-row items-center gap-3 bg-transparent`}>
        <ThemedView
          style={tw`flex-1 flex-row items-center gap-1 bg-transparent`}
        >
          <ThemedText type="body1">{title}</ThemedText>
          {hint && (
            <IconButton
              icon="info"
              size={20}
              onPress={() => hintSheetRef.current?.present()}
              accessibilityLabel={hintLabel ?? title}
              style={tw`-my-3`}
            />
          )}
        </ThemedView>
        {onAdd && !empty && (
          <Button
            leftIcon="plus"
            variant="outline"
            size="small"
            onPress={onAdd}
            accessibilityLabel={addLabel}
          />
        )}
        {right}
      </ThemedView>
      {onAdd && empty && (
        <ThemedView style={tw`flex-row bg-transparent`}>
          <Button
            label={addLabel}
            leftIcon="plus"
            variant="outline"
            size="small"
            onPress={onAdd}
          />
        </ThemedView>
      )}
      {hint && (
        <InfoBottomSheet ref={hintSheetRef} title={title} message={hint} />
      )}
    </ThemedView>
  );
}
