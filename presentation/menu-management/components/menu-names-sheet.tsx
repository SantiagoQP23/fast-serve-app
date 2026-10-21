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

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 60;
// Room for a few names, one per line.
const NAMES_INPUT_MIN_HEIGHT = 120;

/** One name per non-empty line, trimmed, without repeats (case-insensitive). */
export const parseNameLines = (text: string): string[] => {
  const seen = new Set<string>();
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      const key = line.toLowerCase();
      if (!line || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

interface MenuNamesSheetProps<T> {
  sheetRef: RefObject<BottomSheetMethods | null>;
  title: string;
  subtitle?: string;
  placeholder: string;
  /** Names already used; the server rejects repeats, so they are caught here. */
  existingNames: string[];
  /** Creates one item. Rejects when it fails (the mutation shows the error). */
  createOne: (name: string) => Promise<T>;
  /** Called with everything created, in order, once at least one was. */
  onCreated: (created: T[]) => void;
}

/**
 * Bottom sheet to create sections or categories by name. Each line is one
 * item, so several can be created at once. If one fails, the lines not yet
 * created stay in the field.
 */
export default function MenuNamesSheet<T>({
  sheetRef,
  title,
  subtitle,
  placeholder,
  existingNames,
  createOne,
  onCreated,
}: MenuNamesSheetProps<T>) {
  const { t } = useTranslation("menuManagement");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const names = parseNameLines(text);

  const handleSubmit = async () => {
    if (names.length === 0 || isSaving) return;

    if (names.some((name) => name.length < MIN_NAME_LENGTH)) {
      setError(t("overview.namesSheet.nameMinLength"));
      return;
    }
    if (names.some((name) => name.length > MAX_NAME_LENGTH)) {
      setError(t("overview.namesSheet.nameMaxLength"));
      return;
    }
    const existing = new Set(existingNames.map((name) => name.toLowerCase()));
    const repeated = names.filter((name) => existing.has(name.toLowerCase()));
    if (repeated.length > 0) {
      setError(
        t("overview.namesSheet.alreadyExists", { names: repeated.join(", ") }),
      );
      return;
    }

    setIsSaving(true);
    const created: T[] = [];
    let failedAt = -1;
    for (let i = 0; i < names.length; i++) {
      try {
        created.push(await createOne(names[i]));
      } catch {
        failedAt = i;
        break;
      }
    }
    setIsSaving(false);

    if (created.length > 0) onCreated(created);

    if (failedAt >= 0) {
      setText(names.slice(failedAt).join("\n"));
      return;
    }
    setText("");
    setError("");
    sheetRef.current?.dismiss();
  };

  return (
    <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
      <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
        <ThemedText type="h3">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="body2" style={tw`text-gray-500 -mt-2`}>
            {subtitle}
          </ThemedText>
        ) : null}
        <TextInput
          bottomSheet
          variant="outlined"
          placeholder={placeholder}
          value={text}
          onChangeText={(value) => {
            setText(value);
            if (error) setError("");
          }}
          multiline
          textAlignVertical="top"
          autoFocus
          containerStyle={tw`py-3`}
          style={{ marginTop: 0, minHeight: NAMES_INPUT_MIN_HEIGHT }}
        />
        {error ? (
          <ThemedText type="small" style={tw`text-red-500`}>
            {error}
          </ThemedText>
        ) : (
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("overview.namesSheet.hint")}
          </ThemedText>
        )}
        <Button
          label={
            names.length > 1
              ? t("overview.namesSheet.createCount", { count: names.length })
              : t("sections.create")
          }
          onPress={handleSubmit}
          loading={isSaving}
          disabled={isSaving || names.length === 0}
        />
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
}
