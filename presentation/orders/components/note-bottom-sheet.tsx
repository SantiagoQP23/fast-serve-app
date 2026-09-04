import { forwardRef, useEffect, useRef, useState } from "react";
import { TextInput as RNTextInput } from "react-native";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

interface NoteBottomSheetProps {
  initialValue: string;
  onSave: (note: string) => void;
  placeholder?: string;
  error?: string;
}

function NoteBottomSheet(
  { initialValue, onSave, placeholder, error }: NoteBottomSheetProps,
  ref: React.ForwardedRef<BottomSheetMethods>,
) {
  const { t } = useTranslation(["common", "orders"]);
  const inputRef = useRef<RNTextInput>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(initialValue);

  useEffect(() => {
    if (!isOpen) return;

    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timeout);
  }, [isOpen]);

  const handleSheetChange = (index: number) => {
    const nextIsOpen = index >= 0;
    if (nextIsOpen && !isOpen) {
      setDraft(initialValue);
    }
    setIsOpen(nextIsOpen);
  };

  return (
    <ThemedBottomSheetModal
      ref={ref}
      enablePanDownToClose
      onChange={handleSheetChange}
    >
      <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
        <TextInput
          ref={inputRef}
          numberOfLines={4}
          multiline
          bottomSheet
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder ?? t("orders:newOrder.addNote")}
          error={error}
        />

        <Button
          label={t("common:actions.save")}
          onPress={() => onSave(draft)}
        />
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
}

export default forwardRef(NoteBottomSheet);
