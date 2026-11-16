import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { toast } from "sonner-native";
import * as Haptics from "expo-haptics";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getErrorMessage } from "@/core/api/get-error-message";
import { formatCurrency } from "@/core/i18n/utils";
import { parseAmount } from "@/core/orders/utils/bill-payment.util";
import { CashRegister } from "@/core/cash-sessions/models/cash-session.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import Chip from "@/presentation/theme/components/chip";
import {
  useCashRegisters,
  useCashRoles,
  useWithdrawCash,
} from "../hooks/useCashSessions";

export type WithdrawCashSheetRef = {
  /** `accountId` preselects that register. */
  present: (accountId?: number) => void;
  dismiss: () => void;
};

const REASON_KEYS = ["safe", "bank", "owner"] as const;

/**
 * Registers cash may leave, same rule as charging (plans/apertura-cierre-caja.md,
 * 13): any register while none is open; otherwise open ones, and a cashier
 * only the ones they opened.
 */
export const getWithdrawableRegisters = (
  registers: CashRegister[],
  userId: string | undefined,
  isCashier: boolean,
) => {
  const open = registers.filter((r) => r.session);
  if (open.length === 0) return registers;
  return isCashier
    ? open.filter((r) => r.session?.openedBy?.id === userId)
    : open;
};

/** Cash out of a register. A cashier's withdrawal waits for an owner/admin. */
const WithdrawCashSheet = forwardRef<WithdrawCashSheetRef>((_, ref) => {
  const { t } = useTranslation(["common", "errors"]);
  const sheetRef = useRef<BottomSheetMethods>(null);
  const { registers } = useCashRegisters();
  const { userId, isCashier, isManager } = useCashRoles();
  const withdraw = useWithdrawCash();

  const choices = useMemo(
    () => getWithdrawableRegisters(registers, userId, isCashier),
    [registers, userId, isCashier],
  );

  const [accountId, setAccountId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{ amount?: string; reason?: string }>(
    {},
  );

  useImperativeHandle(ref, () => ({
    present: (preselect) => {
      setAccountId(
        preselect && choices.some((c) => c.account.id === preselect)
          ? preselect
          : (choices[0]?.account.id ?? null),
      );
      setAmount("");
      setReason("");
      setErrors({});
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const value = parseAmount(amount);

  const handleSubmit = () => {
    const nextErrors = {
      amount:
        value > 0
          ? undefined
          : t("common:cashRegister.withdraw.amountRequired"),
      reason: reason.trim()
        ? undefined
        : t("common:cashRegister.withdraw.reasonRequired"),
    };
    setErrors(nextErrors);
    if (nextErrors.amount || nextErrors.reason || !accountId) return;

    withdraw.mutate(
      { accountId, amount: value, reason: reason.trim() },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          toast.success(
            t(
              isManager
                ? "common:cashRegister.withdraw.done"
                : "common:cashRegister.withdraw.requested",
            ),
          );
          sheetRef.current?.dismiss();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  return (
    <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
      <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
        <ThemedView style={tw`gap-1`}>
          <ThemedText type="h3">
            {t("common:cashRegister.withdraw.title")}
          </ThemedText>
          {!isManager && (
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("common:cashRegister.withdraw.needsApproval")}
            </ThemedText>
          )}
        </ThemedView>

        {choices.length > 1 && (
          <ThemedView style={tw`flex-row flex-wrap gap-2`}>
            {choices.map((choice) => (
              <Chip
                key={choice.account.id}
                variant="filter"
                label={choice.account.name}
                selected={accountId === choice.account.id}
                onPress={() => setAccountId(choice.account.id)}
              />
            ))}
          </ThemedView>
        )}

        <TextInput
          bottomSheet
          variant="outlined"
          label={t("common:cashRegister.withdraw.amount")}
          value={amount}
          onChangeText={(text) => {
            setAmount(text);
            if (errors.amount) setErrors((e) => ({ ...e, amount: undefined }));
          }}
          inputMode="decimal"
          placeholder="0.00"
          icon="banknote"
          error={errors.amount}
        />

        <ThemedView style={tw`flex-row flex-wrap gap-2`}>
          {REASON_KEYS.map((key) => {
            const label = t(`common:cashRegister.withdraw.reasons.${key}`);
            return (
              <Chip
                key={key}
                variant="filter"
                label={label}
                selected={reason.trim() === label}
                onPress={() => {
                  setReason(label);
                  if (errors.reason)
                    setErrors((e) => ({ ...e, reason: undefined }));
                }}
              />
            );
          })}
        </ThemedView>

        <TextInput
          bottomSheet
          variant="outlined"
          label={t("common:cashRegister.withdraw.reason")}
          placeholder={t("common:cashRegister.withdraw.reasonPlaceholder")}
          value={reason}
          onChangeText={(text) => {
            setReason(text);
            if (errors.reason) setErrors((e) => ({ ...e, reason: undefined }));
          }}
          maxLength={200}
          error={errors.reason}
        />

        <Button
          label={
            value > 0
              ? t("common:cashRegister.withdraw.submit", {
                  amount: formatCurrency(value),
                })
              : t("common:cashRegister.withdraw.action")
          }
          leftIcon="arrow-up-from-line"
          onPress={handleSubmit}
          loading={withdraw.isPending}
          disabled={!accountId || withdraw.isPending}
        />
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
});

WithdrawCashSheet.displayName = "WithdrawCashSheet";

export default WithdrawCashSheet;
