import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Pressable, TextInput as RNTextInput } from "react-native";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

interface DeleteAccountBottomSheetProps {
  username: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

function DeleteAccountBottomSheet(
  { username, onConfirm, isLoading }: DeleteAccountBottomSheetProps,
  ref: React.ForwardedRef<BottomSheetMethods>,
) {
  const { t } = useTranslation(["auth", "common"]);
  const bottomSheetModalRef = useRef<BottomSheetMethods>(null);
  const inputRef = useRef<RNTextInput>(null);
  const [draft, setDraft] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    present: () => bottomSheetModalRef.current?.present(),
    dismiss: () => bottomSheetModalRef.current?.dismiss(),
    snapToIndex: (index: number) =>
      bottomSheetModalRef.current?.snapToIndex?.(index),
    snapToPosition: (position: number | string) =>
      bottomSheetModalRef.current?.snapToPosition?.(position),
    expand: () => bottomSheetModalRef.current?.expand?.(),
    collapse: () => bottomSheetModalRef.current?.collapse?.(),
    close: () => bottomSheetModalRef.current?.close?.(),
    forceClose: () => bottomSheetModalRef.current?.forceClose?.(),
  }));

  useEffect(() => {
    if (!isOpen) return;

    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timeout);
  }, [isOpen]);

  const handleSheetChange = useCallback(
    (index: number) => {
      const nextIsOpen = index >= 0;
      if (!nextIsOpen && isOpen) {
        setDraft("");
      }
      setIsOpen(nextIsOpen);
    },
    [isOpen],
  );

  const handleDismiss = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const isConfirmed = draft.trim() === username;

  return (
    <ThemedBottomSheetModal
      ref={bottomSheetModalRef}
      enablePanDownToClose
      onChange={handleSheetChange}
    >
      <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
        <ThemedView style={tw`gap-1`}>
          <ThemedText type="h3" style={tw`self-center`}>
            {t("auth:account.deleteAccountTitle")}
          </ThemedText>
          <ThemedText
            type="body2"
            style={tw`text-gray-500 self-center text-center`}
          >
            {t("auth:account.deleteAccountSubtitle")}
          </ThemedText>
        </ThemedView>

        <TextInput
          ref={inputRef}
          bottomSheet
          value={draft}
          onChangeText={setDraft}
          placeholder={username}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />

        <Pressable
          disabled={!isConfirmed || isLoading}
          onPress={onConfirm}
          style={({ pressed }) =>
            tw.style(
              "flex-row items-center justify-center gap-3 rounded-3xl px-5 py-3 bg-red-600",
              (!isConfirmed || isLoading) && "opacity-50",
              pressed && "opacity-80",
            )
          }
        >
          {isLoading ? (
            <ThemedText type="body1" style={tw`text-white`}>
              {t("common:actions.delete")}...
            </ThemedText>
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <ThemedText type="body1" style={tw`text-white`}>
                {t("common:actions.delete")}
              </ThemedText>
            </>
          )}
        </Pressable>

        <Button
          label={t("common:actions.cancel")}
          variant="outline"
          onPress={handleDismiss}
          disabled={isLoading}
        />
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
}

export default forwardRef(DeleteAccountBottomSheet);
