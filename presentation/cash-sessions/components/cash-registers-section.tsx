import { useMemo, useRef } from "react";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { toast } from "sonner-native";
import dayjs from "dayjs";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatTime } from "@/core/i18n/utils";
import { CashRegister } from "@/core/cash-sessions/models/cash-session.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Card from "@/presentation/theme/components/card";
import Label from "@/presentation/theme/components/label";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import OpenRegisterSheet, { OpenRegisterSheetRef } from "./open-register-sheet";
import WithdrawCashSheet, {
  WithdrawCashSheetRef,
  getWithdrawableRegisters,
} from "./withdraw-cash-sheet";
import { useCashRegisters, useCashRoles } from "../hooks/useCashSessions";

/** Forgotten registers: open over 18 hours reads "since yesterday". */
const FORGOTTEN_HOURS = 18;

export const registerOpenText = (
  register: CashRegister,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, options?: any) => string,
) => {
  const session = register.session;
  if (!session) return t("common:cashRegister.closed");
  const name = session.openedBy?.person?.firstName ?? "—";
  return dayjs().diff(dayjs(session.openedAt), "hour") >= FORGOTTEN_HOURS
    ? t("common:cashRegister.openSinceYesterday", { name })
    : t("common:cashRegister.openSince", {
        time: formatTime(session.openedAt),
        name,
      });
};

/**
 * Registers strip for the Ingresos tab (owner, admin, cashier): each register
 * with its state, tap to open it or see its summary, plus cash withdrawals
 * and the closings history.
 */
export default function CashRegistersSection() {
  const { t } = useTranslation(["common"]);
  const router = useRouter();
  const { registers, isLoading } = useCashRegisters();
  const { userId, isManager, isCashier } = useCashRoles();
  const openSheetRef = useRef<OpenRegisterSheetRef>(null);
  const withdrawSheetRef = useRef<WithdrawCashSheetRef>(null);

  const withdrawable = useMemo(
    () => getWithdrawableRegisters(registers, userId, isCashier),
    [registers, userId, isCashier],
  );

  if (isLoading && registers.length === 0) return null;

  const onPressRegister = (register: CashRegister) => {
    const session = register.session;
    if (!session) {
      openSheetRef.current?.present(register);
      return;
    }
    if (isManager || session.openedBy?.id === userId) {
      router.push(`/cash-session/${session.id}`);
      return;
    }
    toast.info(t("common:cashRegister.notYours"));
  };

  return (
    <ThemedView>
      <ThemedView style={tw`flex-row items-center justify-between mb-3`}>
        <ThemedText type="h4">{t("common:cashRegister.title")}</ThemedText>
        <IconButton
          icon="history"
          size={20}
          accessibilityLabel={t("common:cashRegister.history")}
          onPress={() => router.push("/cash-session")}
        />
      </ThemedView>

      {registers.length === 0 ? (
        <ThemedText type="body2" style={tw`text-gray-500`}>
          {t("common:cashRegister.noRegisters")}
        </ThemedText>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw`gap-3`}
        >
          {registers.map((register) => {
            const isOpen = !!register.session;
            return (
              <Card
                key={register.account.id}
                variant="outline"
                containerStyle={tw`w-52`}
                style={tw`gap-2`}
                onPress={() => onPressRegister(register)}
                accessibilityRole="button"
              >
                <ThemedView style={tw`flex-row items-center justify-between`}>
                  <ThemedText type="body1" numberOfLines={1} style={tw`flex-1`}>
                    {register.account.name}
                  </ThemedText>
                  <Label
                    size="small"
                    color={isOpen ? "success" : "default"}
                    text={
                      isOpen
                        ? t("common:cashRegister.open")
                        : t("common:cashRegister.closed")
                    }
                  />
                </ThemedView>
                <ThemedText
                  type="small"
                  style={tw`text-gray-500`}
                  numberOfLines={1}
                >
                  {isOpen
                    ? registerOpenText(register, t)
                    : t("common:cashRegister.openRegister")}
                </ThemedText>
              </Card>
            );
          })}
        </ScrollView>
      )}

      {withdrawable.length > 0 && (
        <ThemedView style={tw`flex-row mt-3`}>
          <Button
            label={t("common:cashRegister.withdraw.action")}
            leftIcon="arrow-up-from-line"
            variant="surface"
            shape="rounded"
            size="small"
            onPress={() => withdrawSheetRef.current?.present()}
          />
        </ThemedView>
      )}

      <OpenRegisterSheet ref={openSheetRef} />
      <WithdrawCashSheet ref={withdrawSheetRef} />
    </ThemedView>
  );
}
