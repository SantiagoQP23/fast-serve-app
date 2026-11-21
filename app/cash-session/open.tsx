import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { toast } from "sonner-native";
import * as Haptics from "expo-haptics";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getErrorMessage } from "@/core/api/get-error-message";
import { formatCurrency } from "@/core/i18n/utils";
import { CashRegister } from "@/core/cash-sessions/models/cash-session.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import Chip from "@/presentation/theme/components/chip";
import CashCountField from "@/presentation/cash-sessions/components/cash-count-field";
import CashCountFooter from "@/presentation/cash-sessions/components/cash-count-footer";
import CashCountDraftBanner from "@/presentation/cash-sessions/components/cash-count-draft-banner";
import { useCashCount } from "@/presentation/cash-sessions/hooks/useCashCount";
import {
  useCashCountDraft,
  useCashCountDraftKey,
} from "@/presentation/cash-sessions/hooks/useCashCountDraft";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import {
  cashCountDraftKey,
  useCashCountDraftStore,
} from "@/presentation/cash-sessions/store/cashCountDraftStore";
import {
  useCashRegisters,
  useOpenCashSession,
} from "@/presentation/cash-sessions/hooks/useCashSessions";

const amountText = (value: number | null | undefined) =>
  value != null ? value.toFixed(2) : "";

/**
 * Opening a register: which one and the starting cash, prefilled from the
 * last count. `accountIds` (comma separated) limits the closed registers to
 * pick from; a single id skips the picker. A count typed by hand is kept as
 * a draft on this phone until the register opens; it wins over the prefill
 * (plans/conteo-caja-borrador.md).
 */
export default function OpenCashSessionScreen() {
  const { t } = useTranslation(["common", "errors"]);
  const router = useRouter();
  const { accountIds } = useLocalSearchParams<{ accountIds?: string }>();
  const { registers, isLoading } = useCashRegisters();
  const openSession = useOpenCashSession();
  const count = useCashCount();
  const [register, setRegister] = useState<CashRegister | null>(null);

  const choices = useMemo(() => {
    const ids = accountIds ? accountIds.split(",") : null;
    return registers.filter(
      (r) => !r.session && (!ids || ids.includes(String(r.account.id))),
    );
  }, [registers, accountIds]);

  const pick = (next: CashRegister) => {
    setRegister(next);
    count.reset({
      breakdown: next.lastCountedBreakdown,
      amount: amountText(next.lastCountedAmount),
    });
  };

  // Preselect the first register once the list arrives.
  if (!register && choices[0]) pick(choices[0]);

  const draftKey = useCashCountDraftKey("open", register?.account.id);
  const draft = useCashCountDraft({
    key: draftKey,
    draft: count.touched
      ? { count: count.snapshot, step: "count", result: null, note: "" }
      : null,
    onRestore: (saved) => count.restore(saved.count),
  });

  // Registers opened meanwhile (here or on another phone) need no draft.
  const { user, currentRestaurant } = useAuthStore();
  useEffect(() => {
    if (!user?.id || !currentRestaurant?.id) return;
    const keys = registers
      .filter((r) => r.session)
      .map((r) =>
        cashCountDraftKey(currentRestaurant.id, user.id, "open", r.account.id),
      );
    if (keys.length) useCashCountDraftStore.getState().discard(...keys);
  }, [registers, user?.id, currentRestaurant?.id]);

  const value = count.value;
  const last = register?.lastCountedAmount ?? null;
  const delta = last != null && !count.isEmpty ? value - last : 0;

  const handleOpen = () => {
    if (!register) return;
    openSession.mutate(
      {
        accountId: register.account.id,
        openingAmount: value,
        openingBreakdown: count.breakdown,
      },
      {
        onSuccess: () => {
          draft.discard();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          toast.success(
            t("common:cashRegister.opened", {
              register: register.account.name,
            }),
          );
          router.back();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
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
          <ThemedView style={tw`gap-1`}>
            {choices.length === 1 && register && (
              <ThemedText type="body2" style={tw`text-gray-500`}>
                {register.account.name}
              </ThemedText>
            )}
            <ThemedText type="h2">
              {t("common:cashRegister.openRegister")}
            </ThemedText>
          </ThemedView>

          {register && draft.restored && (
            <CashCountDraftBanner
              savedAt={draft.restored.savedAt}
              onStartOver={() => {
                draft.discard();
                pick(register);
              }}
            />
          )}

          {!register && (
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {isLoading
                ? t("common:status.loading")
                : t("common:cashRegister.noRegisters")}
            </ThemedText>
          )}

          {choices.length > 1 && (
            <ThemedView style={tw`gap-2`}>
              <ThemedText type="body2" style={tw`text-gray-500`}>
                {t("common:cashRegister.pickRegister")}
              </ThemedText>
              <ThemedView style={tw`flex-row flex-wrap gap-2`}>
                {choices.map((choice) => (
                  <Chip
                    key={choice.account.id}
                    variant="filter"
                    label={choice.account.name}
                    selected={register?.account.id === choice.account.id}
                    onPress={() => pick(choice)}
                  />
                ))}
              </ThemedView>
            </ThemedView>
          )}

          {register && (
            <ThemedView style={tw`gap-2`}>
              <CashCountField
                count={count}
                amountLabel={t("common:cashRegister.openAmount")}
              />
              <ThemedText type="small" style={tw`text-gray-500`}>
                {last != null
                  ? t("common:cashRegister.lastCount", {
                      amount: formatCurrency(last),
                    })
                  : t("common:cashRegister.openAmountHint")}
              </ThemedText>
              {Math.abs(delta) >= 0.005 && (
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {t(
                    delta < 0
                      ? "common:cashRegister.openedLess"
                      : "common:cashRegister.openedMore",
                    { amount: formatCurrency(Math.abs(delta)) },
                  )}
                </ThemedText>
              )}
            </ThemedView>
          )}
        </ScrollView>

        {register && (
          <CashCountFooter count={count}>
            <Button
              label={t("common:cashRegister.openRegister")}
              leftIcon="lock-open"
              onPress={handleOpen}
              loading={openSession.isPending}
              disabled={openSession.isPending || !(value >= 0)}
            />
          </CashCountFooter>
        )}
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
