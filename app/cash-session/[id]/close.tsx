import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { toast } from "sonner-native";
import * as Haptics from "expo-haptics";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { getErrorMessage } from "@/core/api/get-error-message";
import { getApiError } from "@/core/api/api-response";
import { CashCountLine } from "@/core/cash-sessions/models/cash-session.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import {
  DetailCard,
  DetailCardRow,
} from "@/presentation/theme/components/detail-card";
import DifferenceLabel from "@/presentation/cash-sessions/components/difference-label";
import CashCountField from "@/presentation/cash-sessions/components/cash-count-field";
import CashCountFooter from "@/presentation/cash-sessions/components/cash-count-footer";
import { useCashCount } from "@/presentation/cash-sessions/hooks/useCashCount";
import {
  useCashRoles,
  useCashSession,
  useCloseCashSession,
} from "@/presentation/cash-sessions/hooks/useCashSessions";

type Result = {
  expectedAmount: number | null;
  countedAmount: number | null;
  difference: number | null;
};

/**
 * Closing a register (plans/apertura-cierre-caja.md, 17). The cashier types
 * the counted cash first and only then sees what was expected. When it
 * doesn't match, the count is locked and a note is needed to close.
 */
export default function CloseCashSessionScreen() {
  const { t } = useTranslation(["common", "errors"]);
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);
  const { session } = useCashSession(sessionId);
  const { isManager } = useCashRoles();
  const closeSession = useCloseCashSession();

  const [step, setStep] = useState<"count" | "note" | "done">("count");
  const count = useCashCount();
  const [note, setNote] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [confirmNoCount, setConfirmNoCount] = useState(false);

  const countedValue = count.value;
  const pendingCount = session?.summary.pendingCount ?? 0;
  // Owner/admin already see it live; a cashier only after counting.
  const liveExpected = isManager ? session?.summary.expectedAmount : null;

  // Owner/admin can skip the count, from the header while counting.
  const canSkipCount = isManager && step === "count";
  useEffect(() => {
    navigation.setOptions({
      headerRight: canSkipCount
        ? () => (
            <Button
              label={t("common:cashRegister.close.closeWithoutCount")}
              variant="text"
              size="small"
              onPress={() => setConfirmNoCount(true)}
              disabled={closeSession.isPending}
            />
          )
        : undefined,
    });
  }, [navigation, canSkipCount, closeSession.isPending, t]);

  const finish = (closed: Result) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success(t("common:cashRegister.close.done"));
    setResult(closed);
    setStep("done");
  };

  const submit = (data: {
    countedAmount?: number;
    countedBreakdown?: CashCountLine[];
    note?: string;
  }) => {
    closeSession.mutate(
      { id: sessionId, ...data },
      {
        onSuccess: (closed) =>
          finish({
            expectedAmount: closed.expectedAmount,
            countedAmount: closed.countedAmount,
            difference: closed.difference,
          }),
        onError: (err) => {
          const apiError = getApiError(err);
          if (
            apiError.code === "FINANCIAL_CASH_SESSION_NOTE_REQUIRED" &&
            apiError.details
          ) {
            setResult(apiError.details as unknown as Result);
            setStep("note");
            return;
          }
          toast.error(getErrorMessage(err));
        },
      },
    );
  };

  const resultCard = result && (
    <DetailCard style={tw`py-2`}>
      <DetailCardRow
        label={t("common:cashRegister.summary.expected")}
        value={
          result.expectedAmount != null
            ? formatCurrency(result.expectedAmount)
            : "—"
        }
      />
      <DetailCardRow
        label={t("common:cashRegister.summary.counted")}
        value={
          result.countedAmount != null
            ? formatCurrency(result.countedAmount)
            : t("common:cashRegister.summary.notCounted")
        }
      />
      <DetailCardRow label={t("common:cashRegister.summary.difference")}>
        <DifferenceLabel difference={result.difference} />
      </DetailCardRow>
    </DetailCard>
  );

  return (
    <KeyboardAvoidingView
      style={tw`flex-1`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScreenLayout style={tw`flex-1`}>
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`px-4 pt-2 pb-6 gap-5`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {session?.account.name ?? ""}
          </ThemedText>

          {step === "count" && (
            <>
              <ThemedView style={tw`gap-1`}>
                <ThemedText type="h2">
                  {t("common:cashRegister.close.countTitle")}
                </ThemedText>
                <ThemedText type="body2" style={tw`text-gray-500`}>
                  {t("common:cashRegister.close.countHint")}
                </ThemedText>
              </ThemedView>

              <CashCountField
                count={count}
                amountLabel={t("common:cashRegister.summary.counted")}
                autoFocus
              />

              {liveExpected != null && (
                <ThemedText type="body2" style={tw`text-gray-500`}>
                  {t("common:cashRegister.summary.expected")}:{" "}
                  {formatCurrency(liveExpected)}
                </ThemedText>
              )}

              {(session?.summary.inCount ?? 0) > 0 && (
                <ThemedText type="body2" style={tw`text-gray-500`}>
                  {t("common:cashRegister.close.addedNote", {
                    amount: formatCurrency(session?.summary.cashIn ?? 0),
                  })}
                </ThemedText>
              )}

              {pendingCount > 0 && (
                <ThemedText type="body2" style={tw`text-gray-500`}>
                  {t("common:cashRegister.close.pendingWarning", {
                    count: pendingCount,
                  })}
                </ThemedText>
              )}
            </>
          )}

          {step === "note" && (
            <>
              <ThemedView style={tw`gap-1`}>
                <ThemedText type="h2">
                  {t("common:cashRegister.close.noteTitle")}
                </ThemedText>
                <ThemedText type="body2" style={tw`text-gray-500`}>
                  {t("common:cashRegister.close.noteHint")}
                </ThemedText>
              </ThemedView>
              {resultCard}
              <TextInput
                variant="outlined"
                label={t("common:cashRegister.summary.note")}
                placeholder={t("common:cashRegister.close.notePlaceholder")}
                value={note}
                onChangeText={setNote}
                maxLength={500}
                multiline
              />
              <Button
                label={t("common:cashRegister.close.closeWithNote")}
                leftIcon="lock"
                onPress={() =>
                  submit({
                    countedAmount: result?.countedAmount ?? countedValue,
                    countedBreakdown: count.breakdown,
                    note: note.trim(),
                  })
                }
                loading={closeSession.isPending}
                disabled={!note.trim() || closeSession.isPending}
              />
            </>
          )}

          {step === "done" && (
            <>
              <ThemedText type="h2">
                {t("common:cashRegister.close.done")}
              </ThemedText>
              {resultCard}
              <Button
                label={t("common:actions.done")}
                onPress={() => router.back()}
              />
            </>
          )}
        </ScrollView>

        {step === "count" && (
          <CashCountFooter count={count}>
            <Button
              label={t("common:cashRegister.close.confirmCount")}
              leftIcon="lock"
              onPress={() =>
                submit({
                  countedAmount: countedValue,
                  countedBreakdown: count.breakdown,
                })
              }
              loading={closeSession.isPending}
              disabled={!(countedValue >= 0) || closeSession.isPending}
            />
          </CashCountFooter>
        )}
      </ScreenLayout>

      <DialogModal
        visible={confirmNoCount}
        title={t("common:cashRegister.close.closeWithoutCount")}
        message={t("common:cashRegister.close.closeWithoutCountMessage")}
        confirmLabel={t("common:cashRegister.closeRegister")}
        onConfirm={() => {
          setConfirmNoCount(false);
          submit({});
        }}
        onCancel={() => setConfirmNoCount(false)}
      />
    </KeyboardAvoidingView>
  );
}
