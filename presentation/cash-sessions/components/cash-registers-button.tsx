import { useRef } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Href, useRouter } from "expo-router";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { toast } from "sonner-native";
import dayjs from "dayjs";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatTime } from "@/core/i18n/utils";
import { CashRegister } from "@/core/cash-sessions/models/cash-session.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Label from "@/presentation/theme/components/label";
import Button from "@/presentation/theme/components/button";
import { useCashRegisters, useCashRoles } from "../hooks/useCashSessions";

/** Forgotten registers: open over 18 hours reads "since yesterday". */
const FORGOTTEN_HOURS = 18;

export const registerOpenText = (
  register: CashRegister,
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
 * Home header "Caja" button for the registers (owner, admin, cashier). A dot marks
 * an open register; tapping opens the "Cajas" sheet: each register with its
 * state (tap to open it on its own screen or see its summary, where cash is withdrawn) and the
 * closings history.
 */
export default function CashRegistersButton() {
  const { t } = useTranslation(["common"]);
  const router = useRouter();
  const { canRunRegisters, userId, isManager } = useCashRoles();
  const { registers } = useCashRegisters(canRunRegisters);
  const sheetRef = useRef<BottomSheetMethods>(null);

  const anyOpen = registers.some((register) => !!register.session);

  if (!canRunRegisters) return null;

  const goTo = (path: Href) => {
    sheetRef.current?.dismiss();
    router.push(path);
  };

  const onPressRegister = (register: CashRegister) => {
    const session = register.session;
    if (!session) {
      goTo({
        pathname: "/cash-session/open",
        params: { accountIds: String(register.account.id) },
      });
      return;
    }
    if (isManager || session.openedBy?.id === userId) {
      goTo(`/cash-session/${session.id}`);
      return;
    }
    toast.info(t("common:cashRegister.notYours"));
  };

  return (
    <>
      <View>
        <Button
          label={t("common:cashRegister.register")}
          leftIcon="banknote"
          variant="surface"
          shape="rounded"
          size="small"
          onPress={() => sheetRef.current?.present()}
        />
        {anyOpen && (
          <View
            pointerEvents="none"
            style={tw`absolute top-0 right-0 w-3 h-3 rounded-full bg-primary border-2 border-background`}
          />
        )}
      </View>

      <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
          <ThemedView style={tw`flex-row items-center justify-between`}>
            <ThemedText type="h3">{t("common:cashRegister.title")}</ThemedText>
            <Button
              variant="text"
              size="small"
              label={t("common:cashRegister.historyAction")}
              onPress={() => goTo("/cash-session")}
            />
          </ThemedView>

          {registers.length === 0 ? (
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("common:cashRegister.noRegisters")}
            </ThemedText>
          ) : (
            <BottomSheetView style={tw`max-h-[50vh]`}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {registers.map((register, index) => {
                  const isOpen = !!register.session;
                  return (
                    <Pressable
                      key={register.account.id}
                      onPress={() => onPressRegister(register)}
                      accessibilityRole="button"
                      style={({ pressed }) =>
                        tw.style(
                          "flex-row items-center gap-3 py-3",
                          index > 0 && "border-t border-divider",
                          pressed && "opacity-60",
                        )
                      }
                    >
                      <View style={tw`flex-1 gap-0.5`}>
                        <ThemedText type="body1" numberOfLines={1}>
                          {register.account.name}
                        </ThemedText>
                        <ThemedText
                          type="small"
                          style={tw`text-gray-500`}
                          numberOfLines={1}
                        >
                          {isOpen
                            ? registerOpenText(register, t)
                            : t("common:cashRegister.openRegister")}
                        </ThemedText>
                      </View>
                      <Label
                        size="small"
                        color={isOpen ? "success" : "default"}
                        text={
                          isOpen
                            ? t("common:cashRegister.open")
                            : t("common:cashRegister.closed")
                        }
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </BottomSheetView>
          )}
        </BottomSheetView>
      </ThemedBottomSheetModal>
    </>
  );
}
