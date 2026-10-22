import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";

import tw from "../lib/tailwind";
import { ThemedBottomSheetModal } from "./themed-bottom-sheet-modal";
import { ThemedText } from "./themed-text";
import TextInput from "./text-input";
import Button from "./button";

export type TextFieldBottomSheetRef = {
  present: () => void;
  dismiss: () => void;
};

interface TextFieldBottomSheetProps {
  title: string;
  value: string;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  /** Shown when saving an empty value; omit to allow clearing the field. */
  requiredMessage?: string;
  submitLabel: string;
  loading?: boolean;
  /** Resolves once saved; the sheet then closes. A rejection keeps it open. */
  onSubmit: (value: string) => Promise<unknown>;
}

/** Edits one text field in a sheet; the draft resets each time it opens. */
const TextFieldBottomSheet = forwardRef<
  TextFieldBottomSheetRef,
  TextFieldBottomSheetProps
>(
  (
    {
      title,
      value,
      placeholder,
      maxLength,
      multiline,
      requiredMessage,
      submitLabel,
      loading,
      onSubmit,
    },
    ref,
  ) => {
    const sheetRef = useRef<BottomSheetMethods>(null);
    const [draft, setDraft] = useState(value);
    const [error, setError] = useState("");

    useImperativeHandle(ref, () => ({
      present: () => {
        setDraft(value);
        setError("");
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleSubmit = async () => {
      const trimmed = draft.trim();
      if (requiredMessage && !trimmed) {
        setError(requiredMessage);
        return;
      }
      try {
        await onSubmit(trimmed);
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
            accessibilityLabel={title}
            placeholder={placeholder}
            value={draft}
            onChangeText={(text) => {
              setDraft(text);
              if (error) setError("");
            }}
            error={error || undefined}
            maxLength={maxLength}
            multiline={multiline}
            autoFocus
            returnKeyType={multiline ? "default" : "done"}
            onSubmitEditing={multiline ? undefined : handleSubmit}
          />
          <Button
            label={submitLabel}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>
    );
  },
);

TextFieldBottomSheet.displayName = "TextFieldBottomSheet";

export default TextFieldBottomSheet;
