import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { toast } from "sonner-native";
import * as Haptics from "expo-haptics";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getErrorMessage } from "@/core/api/get-error-message";
import { formatCurrency } from "@/core/i18n/utils";
import { CashRegister } from "@/core/cash-sessions/models/cash-session.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import Chip from "@/presentation/theme/components/chip";
import { useOpenCashSession } from "../hooks/useCashSessions";
import { useCashCount } from "../hooks/useCashCount";
import CashCountField from "./cash-count-field";

export type OpenRegisterSheetRef = {
  /**
   * Opens the sheet for one register, or with a picker of `choices` (closed
   * registers) when no register is given.
   */
  present: (register?: CashRegister, choices?: CashRegister[]) => void;
  dismiss: () => void;
};

interface OpenRegisterSheetProps {
  onOpened?: (register: CashRegister) => void;
}

const amountText = (value: number | null | undefined) =>
  value != null ? value.toFixed(2) : "";

/** Opening a register: which one and the starting cash, prefilled from the last count. */
const OpenRegisterSheet = forwardRef<
  OpenRegisterSheetRef,
  OpenRegisterSheetProps
>(({ onOpened }, ref) => {
  const { t } = useTranslation(["common", "errors"]);
  const sheetRef = useRef<BottomSheetMethods>(null);
  const openSession = useOpenCashSession();
  const [choices, setChoices] = useState<CashRegister[]>([]);
  const [register, setRegister] = useState<CashRegister | null>(null);
  const count = useCashCount();

  const pick = (next: CashRegister) => {
    setRegister(next);
    count.reset({
      breakdown: next.lastCountedBreakdown,
      amount: amountText(next.lastCountedAmount),
    });
  };

  useImperativeHandle(ref, () => ({
    present: (target, options) => {
      const list = target ? [target] : (options ?? []);
      setChoices(list);
      if (list[0]) pick(list[0]);
      else {
        setRegister(null);
        count.reset();
      }
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

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
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          toast.success(
            t("common:cashRegister.opened", {
              register: register.account.name,
            }),
          );
          sheetRef.current?.dismiss();
          onOpened?.(register);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  return (
    <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
      <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
        <ThemedText type="h3">
          {choices.length === 1 && register
            ? `${t("common:cashRegister.openRegister")} · ${register.account.name}`
            : t("common:cashRegister.openRegister")}
        </ThemedText>

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

        <ThemedView style={tw`gap-2`}>
          <CashCountField
            count={count}
            amountLabel={t("common:cashRegister.openAmount")}
            bottomSheet
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

        <Button
          label={t("common:cashRegister.openRegister")}
          leftIcon="lock-open"
          onPress={handleOpen}
          loading={openSession.isPending}
          disabled={!register || openSession.isPending || !(value >= 0)}
        />
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
});

OpenRegisterSheet.displayName = "OpenRegisterSheet";

export default OpenRegisterSheet;
