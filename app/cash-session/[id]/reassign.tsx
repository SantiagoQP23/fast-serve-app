import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { toast } from "sonner-native";
import * as Haptics from "expo-haptics";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { getErrorMessage } from "@/core/api/get-error-message";
import { getApiError } from "@/core/api/api-response";
import { getUserDisplayName } from "@/core/auth/utils/get-user-display-name";
import {
  AssignableUser,
  registerHolder,
} from "@/core/cash-sessions/models/cash-session.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import Switch from "@/presentation/theme/components/switch";
import RadioButton from "@/presentation/theme/components/radio-button";
import {
  DetailCard,
  DetailCardRow,
} from "@/presentation/theme/components/detail-card";
import DifferenceLabel from "@/presentation/cash-sessions/components/difference-label";
import CashCountField from "@/presentation/cash-sessions/components/cash-count-field";
import CashCountFooter from "@/presentation/cash-sessions/components/cash-count-footer";
import { useCashCount } from "@/presentation/cash-sessions/hooks/useCashCount";
import {
  useAssignableUsers,
  useCashRoles,
  useCashSession,
  useReassignCashSession,
} from "@/presentation/cash-sessions/hooks/useCashSessions";

const nameOf = (user: AssignableUser) =>
  [user.person?.firstName, user.person?.lastName].filter(Boolean).join(" ") ||
  user.username;

type CountResult = {
  expectedAmount: number;
  countedAmount: number;
  difference: number;
};

/**
 * Hand an open register to someone else without closing it
 * (plans/reasignar-caja.md). Pick the person; optionally count first, blind
 * like at close. A count that doesn't match needs a note.
 */
export default function ReassignCashSessionScreen() {
  const { t } = useTranslation(["common", "errors", "auth"]);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);
  const { session } = useCashSession(sessionId);
  const { users, isLoading } = useAssignableUsers(sessionId);
  const { isManager } = useCashRoles();
  const reassign = useReassignCashSession();
  const count = useCashCount();

  const [toUserId, setToUserId] = useState<string | null>(null);
  const [withCount, setWithCount] = useState(false);
  const [step, setStep] = useState<"pick" | "count" | "note">("pick");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<CountResult | null>(null);

  const target = users.find((u) => u.id === toUserId);
  const targetName = target ? nameOf(target) : "";
  const holder = session ? registerHolder(session) : null;
  // Owner/admin see the expected cash live; a cashier counts blind.
  const liveExpected = isManager ? session?.summary.expectedAmount : null;

  const submit = (data: {
    countedAmount?: number;
    countedBreakdown?: typeof count.breakdown;
    note?: string;
  }) => {
    if (!toUserId) return;
    reassign.mutate(
      { id: sessionId, toUserId, ...data },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          toast.success(
            t("common:cashRegister.reassign.done", { name: targetName }),
          );
          router.back();
        },
        onError: (err) => {
          const apiError = getApiError(err);
          if (
            apiError.code === "FINANCIAL_CASH_SESSION_NOTE_REQUIRED" &&
            apiError.details
          ) {
            setResult(apiError.details as unknown as CountResult);
            setStep("note");
            return;
          }
          toast.error(getErrorMessage(err));
        },
      },
    );
  };

  const onContinue = () => {
    if (withCount) {
      count.reset();
      setStep("count");
      return;
    }
    submit({});
  };

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

          {step === "pick" && (
            <>
              <ThemedView style={tw`gap-1`}>
                <ThemedText type="h2">
                  {t("common:cashRegister.reassign.title")}
                </ThemedText>
                <ThemedText type="body2" style={tw`text-gray-500`}>
                  {holder
                    ? t("common:cashRegister.reassign.hint", {
                        name: getUserDisplayName(holder, "—"),
                      })
                    : t("common:cashRegister.reassign.noHolder")}
                </ThemedText>
              </ThemedView>

              <ThemedView style={tw`gap-1`}>
                {isLoading ? (
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {t("common:status.loading")}
                  </ThemedText>
                ) : users.length === 0 ? (
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {t("common:cashRegister.reassign.nobody")}
                  </ThemedText>
                ) : (
                  users.map((user) => (
                    <RadioButton
                      key={user.id}
                      selected={toUserId === user.id}
                      onPress={() => setToUserId(user.id)}
                      label={nameOf(user)}
                      trailing={
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          {t(`auth:roles.${user.role}`)}
                        </ThemedText>
                      }
                    />
                  ))
                )}
              </ThemedView>

              <Switch
                label={t("common:cashRegister.reassign.countFirst")}
                value={withCount}
                onValueChange={setWithCount}
              />
              <ThemedText type="small" style={tw`text-gray-500 -mt-3`}>
                {t("common:cashRegister.reassign.countFirstHint")}
              </ThemedText>
            </>
          )}

          {step === "count" && (
            <>
              <ThemedView style={tw`gap-1`}>
                <ThemedText type="h2">
                  {t("common:cashRegister.close.countTitle")}
                </ThemedText>
                <ThemedText type="body2" style={tw`text-gray-500`}>
                  {t("common:cashRegister.reassign.countHint", {
                    name: targetName,
                  })}
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
            </>
          )}

          {step === "note" && result && (
            <>
              <ThemedView style={tw`gap-1`}>
                <ThemedText type="h2">
                  {t("common:cashRegister.close.noteTitle")}
                </ThemedText>
                <ThemedText type="body2" style={tw`text-gray-500`}>
                  {t("common:cashRegister.reassign.noteHint")}
                </ThemedText>
              </ThemedView>
              <DetailCard style={tw`py-2`}>
                <DetailCardRow
                  label={t("common:cashRegister.summary.expected")}
                  value={formatCurrency(result.expectedAmount)}
                />
                <DetailCardRow
                  label={t("common:cashRegister.summary.counted")}
                  value={formatCurrency(result.countedAmount)}
                />
                <DetailCardRow
                  label={t("common:cashRegister.summary.difference")}
                >
                  <DifferenceLabel difference={result.difference} />
                </DetailCardRow>
              </DetailCard>
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
                label={t("common:cashRegister.reassign.submit", {
                  name: targetName,
                })}
                leftIcon="user-round-pen"
                onPress={() =>
                  submit({
                    countedAmount: result.countedAmount,
                    countedBreakdown: count.breakdown,
                    note: note.trim(),
                  })
                }
                loading={reassign.isPending}
                disabled={!note.trim() || reassign.isPending}
              />
            </>
          )}
        </ScrollView>

        {step === "pick" && (
          <ThemedView style={tw`px-4 pb-6 pt-2`}>
            <Button
              label={
                withCount
                  ? t("common:cashRegister.reassign.continue")
                  : target
                    ? t("common:cashRegister.reassign.submit", {
                        name: targetName,
                      })
                    : t("common:cashRegister.reassign.pickSomeone")
              }
              leftIcon="user-round-pen"
              onPress={onContinue}
              loading={reassign.isPending}
              disabled={!toUserId || reassign.isPending}
            />
          </ThemedView>
        )}

        {step === "count" && (
          <CashCountFooter count={count}>
            <Button
              label={t("common:cashRegister.reassign.submit", {
                name: targetName,
              })}
              leftIcon="user-round-pen"
              onPress={() =>
                submit({
                  countedAmount: count.value,
                  countedBreakdown: count.breakdown,
                })
              }
              loading={reassign.isPending}
              disabled={
                count.isEmpty || !(count.value >= 0) || reassign.isPending
              }
            />
          </CashCountFooter>
        )}
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
