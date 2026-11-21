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
import {
  CashRegister,
  isRegisterHolder,
} from "@/core/cash-sessions/models/cash-session.model";
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
  useDepositCash,
  useWithdrawCash,
} from "../hooks/useCashSessions";

/** "out": withdraw cash. "in": add cash to an open register. */
export type CashMovementKind = "in" | "out";

export type CashMovementSheetRef = {
  /** `accountId` preselects that register. */
  present: (kind: CashMovementKind, accountId?: number) => void;
  dismiss: () => void;
};

const REASON_KEYS: Record<CashMovementKind, readonly string[]> = {
  out: ["safe", "bank", "owner"],
  in: ["change", "owner", "safe"],
};

/**
 * Registers cash may leave, same rule as charging (plans/apertura-cierre-caja.md,
 * 13): any register while none is open; otherwise open ones, and a cashier
 * only the ones they run.
 */
export const getWithdrawableRegisters = (
  registers: CashRegister[],
  userId: string | undefined,
  isCashier: boolean,
) => {
  const open = registers.filter((r) => r.session);
  if (open.length === 0) return registers;
  return isCashier
    ? open.filter((r) => r.session && isRegisterHolder(r.session, userId))
    : open;
};

/**
 * Registers cash can be added to (plans/ingreso-efectivo-caja.md, 4–5): open
 * ones only; a cashier only the ones they run.
 */
export const getDepositableRegisters = (
  registers: CashRegister[],
  userId: string | undefined,
  isCashier: boolean,
) =>
  registers.filter(
    (r) => r.session && (!isCashier || isRegisterHolder(r.session, userId)),
  );

/**
 * Cash out of or into a register. A cashier's withdrawal waits for an
 * owner/admin; adding cash never does.
 */
const CashMovementSheet = forwardRef<CashMovementSheetRef>((_, ref) => {
  const { t } = useTranslation(["common", "errors"]);
  const sheetRef = useRef<BottomSheetMethods>(null);
  const { registers } = useCashRegisters();
  const { userId, isCashier, isManager } = useCashRoles();
  const withdraw = useWithdrawCash();
  const deposit = useDepositCash();

  const [kind, setKind] = useState<CashMovementKind>("out");
  const isIn = kind === "in";
  const mutation = isIn ? deposit : withdraw;
  const copy = isIn ? "deposit" : "withdraw";

  const choices = useMemo(
    () =>
      isIn
        ? getDepositableRegisters(registers, userId, isCashier)
        : getWithdrawableRegisters(registers, userId, isCashier),
    [isIn, registers, userId, isCashier],
  );

  const [accountId, setAccountId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{ amount?: string; reason?: string }>(
    {},
  );

  useImperativeHandle(ref, () => ({
    present: (nextKind, preselect) => {
      const nextChoices =
        nextKind === "in"
          ? getDepositableRegisters(registers, userId, isCashier)
          : getWithdrawableRegisters(registers, userId, isCashier);
      setKind(nextKind);
      setAccountId(
        preselect && nextChoices.some((c) => c.account.id === preselect)
          ? preselect
          : (nextChoices[0]?.account.id ?? null),
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
        value > 0 ? undefined : t(`common:cashRegister.${copy}.amountRequired`),
      reason: reason.trim()
        ? undefined
        : t(`common:cashRegister.${copy}.reasonRequired`),
    };
    setErrors(nextErrors);
    if (nextErrors.amount || nextErrors.reason || !accountId) return;

    mutation.mutate(
      { accountId, amount: value, reason: reason.trim() },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          toast.success(
            t(
              isIn
                ? "common:cashRegister.deposit.done"
                : isManager
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
            {t(`common:cashRegister.${copy}.title`)}
          </ThemedText>
          {!isIn && !isManager && (
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
          label={t(`common:cashRegister.${copy}.amount`)}
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
          {REASON_KEYS[kind].map((key) => {
            const label = t(`common:cashRegister.${copy}.reasons.${key}`);
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
          label={t(`common:cashRegister.${copy}.reason`)}
          placeholder={t(`common:cashRegister.${copy}.reasonPlaceholder`)}
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
              ? t(`common:cashRegister.${copy}.submit`, {
                  amount: formatCurrency(value),
                })
              : t(`common:cashRegister.${copy}.action`)
          }
          leftIcon={isIn ? "arrow-down-to-line" : "arrow-up-from-line"}
          onPress={handleSubmit}
          loading={mutation.isPending}
          disabled={!accountId || mutation.isPending}
        />
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
});

CashMovementSheet.displayName = "CashMovementSheet";

export default CashMovementSheet;
