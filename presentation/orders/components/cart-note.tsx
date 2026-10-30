import { useRef } from "react";
import { Pressable } from "react-native";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useNewOrderStore } from "../store/newOrderStore";
import NoteBottomSheet from "./note-bottom-sheet";

/**
 * The cart order's note, or "Add note" when there is none: tap to edit. Same
 * as the product sheet's note.
 */
export default function CartNote() {
  const { t } = useTranslation(["menu", "orders"]);
  const notes = useNewOrderStore((state) => state.notes);
  const setNotes = useNewOrderStore((state) => state.setNotes);
  const noteSheetRef = useRef<BottomSheetMethods>(null);
  const hasNote = notes.trim() !== "";

  return (
    <>
      <Pressable
        onPress={() => noteSheetRef.current?.present()}
        accessibilityRole="button"
        accessibilityLabel={
          hasNote
            ? `${t("menu:product.editNote")}: ${notes}`
            : t("orders:newOrder.addNote")
        }
        style={({ pressed }) => [
          tw`self-start py-3 min-h-12 justify-center`,
          hasNote && tw`self-stretch`,
          pressed && tw`opacity-60`,
        ]}
      >
        <ThemedText
          type="body2"
          numberOfLines={hasNote ? 3 : 1}
          style={!hasNote && tw`text-gray-500`}
        >
          {hasNote ? notes : `${t("orders:newOrder.addNote")}...`}
        </ThemedText>
      </Pressable>

      <NoteBottomSheet
        ref={noteSheetRef}
        initialValue={notes}
        onSave={(note) => {
          setNotes(note.trim());
          noteSheetRef.current?.dismiss();
        }}
        placeholder={t("orders:newOrder.notesPlaceholder")}
      />
    </>
  );
}
