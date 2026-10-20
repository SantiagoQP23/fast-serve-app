import { useState, type RefObject } from "react";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

interface TagNameSheetProps {
  sheetRef: RefObject<BottomSheetMethods | null>;
  title: string;
  submitLabel: string;
  /** Name the input starts with; give the sheet a `key` to reset it. */
  initialName?: string;
  loading?: boolean;
  /** Resolves once saved; the sheet then closes. */
  onSubmit: (name: string) => Promise<unknown>;
}

/** Bottom sheet with one field to name a new tag or rename one. */
export default function TagNameSheet({
  sheetRef,
  title,
  submitLabel,
  initialName = "",
  loading,
  onSubmit,
}: TagNameSheetProps) {
  const { t } = useTranslation("menuManagement");
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError(t("tags.validations.nameMinLength"));
      return;
    }
    try {
      await onSubmit(trimmed);
      setName(initialName);
      setError("");
      sheetRef.current?.dismiss();
    } catch {
      // The mutation already shows the error.
    }
  };

  return (
    <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
      <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
        <ThemedText type="h3">{title}</ThemedText>
        <TextInput
          bottomSheet
          variant="outlined"
          label={t("tags.fields.name")}
          placeholder={t("tags.placeholders.name")}
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (error) setError("");
          }}
          maxLength={50}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
        {error ? (
          <ThemedText type="small" style={tw`text-red-500`}>
            {error}
          </ThemedText>
        ) : null}
        <Button
          label={submitLabel}
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
        />
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
}
