import { Modal, View } from "react-native";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import Button, { ButtonProps } from "./button";
import tw from "../lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { typography } from "@/constants/theme";

interface DialogModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: ButtonProps["variant"];
  loading?: boolean;
}

export default function DialogModal({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel,
  confirmVariant = "text",
  loading = false,
}: DialogModalProps) {
  const { t } = useTranslation(["common"]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={tw`flex-1 bg-black/50 items-center justify-center`}>
        <View style={tw`bg-white rounded-2xl w-4/5 p-6 shadow-lg`}>
          <ThemedText type="h3" style={{ fontFamily: typography.medium }}>
            {title}
          </ThemedText>
          <ThemedText
            type="body1"
            style={[tw`mt-4 mb-4`, { fontFamily: typography.regular }]}
          >
            {message}
          </ThemedText>

          <ThemedView style={tw`flex-row justify-end gap-2`}>
            <Button
              label={cancelLabel ?? t("common:actions.cancel")}
              onPress={onCancel}
              variant="text"
              size="small"
              disabled={loading}
            />
            <Button
              label={confirmLabel}
              onPress={onConfirm}
              variant={confirmVariant}
              size="small"
              loading={loading}
              disabled={loading}
            />
          </ThemedView>
        </View>
      </View>
    </Modal>
  );
}
