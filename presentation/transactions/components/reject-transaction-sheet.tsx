import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { toast } from "sonner-native";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getErrorMessage } from "@/core/api/get-error-message";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import Chip from "@/presentation/theme/components/chip";
import { useRejectTransaction } from "@/presentation/transactions/hooks/useTransaction";

export type RejectTransactionSheetRef = {
  present: () => void;
  dismiss: () => void;
};

interface RejectTransactionSheetProps {
  transactionId: number;
  onRejected?: () => void;
}

const REASON_KEYS = ["amountMismatch", "unreadable", "notReceived"] as const;

/**
 * Asks why a transfer is being rejected. The common reasons fill the field in
 * one tap and stay editable; the reason is shown to whoever uploaded the proof.
 */
const RejectTransactionSheet = forwardRef<
  RejectTransactionSheetRef,
  RejectTransactionSheetProps
>(({ transactionId, onRejected }, ref) => {
  const { t } = useTranslation(["bills", "common"]);
  const sheetRef = useRef<BottomSheetMethods>(null);
  const { rejectTransaction, isLoading } = useRejectTransaction();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useImperativeHandle(ref, () => ({
    present: () => {
      setReason("");
      setError("");
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const handleReject = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError(t("bills:proofUpload.rejectReasonRequired"));
      return;
    }
    rejectTransaction(
      { id: transactionId, reason: trimmed },
      {
        onSuccess: () => {
          sheetRef.current?.dismiss();
          toast.success(t("bills:proofUpload.rejectSuccess"));
          onRejected?.();
        },
        onError: (err) => {
          toast.error(getErrorMessage(err, { fallbackToServerMessage: true }));
        },
      },
    );
  };

  return (
    <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
      <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
        <ThemedView style={tw`gap-1`}>
          <ThemedText type="h3">{t("bills:proofUpload.rejectTitle")}</ThemedText>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {t("bills:proofUpload.rejectMessage")}
          </ThemedText>
        </ThemedView>

        <ThemedView style={tw`flex-row flex-wrap gap-2`}>
          {REASON_KEYS.map((key) => {
            const label = t(`bills:proofUpload.rejectReasons.${key}`);
            return (
              <Chip
                key={key}
                variant="filter"
                label={label}
                selected={reason.trim() === label}
                onPress={() => {
                  setReason(label);
                  if (error) setError("");
                }}
              />
            );
          })}
        </ThemedView>

        <TextInput
          bottomSheet
          variant="outlined"
          accessibilityLabel={t("bills:proofUpload.rejectionReason")}
          placeholder={t("bills:proofUpload.rejectReasonPlaceholder")}
          value={reason}
          onChangeText={(text) => {
            setReason(text);
            if (error) setError("");
          }}
          error={error || undefined}
          maxLength={200}
          multiline
        />

        <Button
          label={t("common:actions.reject")}
          variant="destructive"
          onPress={handleReject}
          loading={isLoading}
          disabled={isLoading}
        />
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
});

RejectTransactionSheet.displayName = "RejectTransactionSheet";

export default RejectTransactionSheet;
