import { useEffect, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { toast } from "sonner-native";
import dayjs from "dayjs";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatTime } from "@/core/i18n/utils";
import {
  CashRegister,
  isRegisterHolder,
  registerHolder,
} from "@/core/cash-sessions/models/cash-session.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import DetailHeader from "@/presentation/theme/components/detail-header";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Label from "@/presentation/theme/components/label";
import Icon from "@/presentation/theme/components/icon";
import {
  useCashRegisters,
  useCashRoles,
} from "@/presentation/cash-sessions/hooks/useCashSessions";

/** Forgotten registers: open over 18 hours reads "since yesterday". */
const FORGOTTEN_HOURS = 18;

const registerOpenText = (
  register: CashRegister,
  t: (key: string, options?: any) => string,
) => {
  const session = register.session;
  if (!session) return t("common:cashRegister.closed");
  const name = registerHolder(session)?.person?.firstName ?? "—";
  return dayjs().diff(dayjs(session.openedAt), "hour") >= FORGOTTEN_HOURS
    ? t("common:cashRegister.openSinceYesterday", { name })
    : t("common:cashRegister.openSince", {
        time: formatTime(session.openedAt),
        name,
      });
};

/**
 * "Cajas", reached from Home's "Caja" pill (owner, admin, cashier): each
 * register with its state (tap to open it on its own screen or see its
 * summary, where cash is withdrawn); the header's top right opens the
 * closings history.
 */
export default function CashRegistersScreen() {
  const { t } = useTranslation(["common"]);
  const router = useRouter();
  const navigation = useNavigation();
  const { canRunRegisters, userId, isManager } = useCashRoles();
  const { registers, isLoading, refetch } = useCashRegisters(canRunRegisters);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          label={t("common:cashRegister.historyAction")}
          variant="text"
          size="small"
          onPress={() => router.push("/cash-session")}
        />
      ),
    });
  }, [navigation, router, t]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const onPressRegister = (register: CashRegister) => {
    const session = register.session;
    if (!session) {
      router.push({
        pathname: "/cash-session/open",
        params: { accountIds: String(register.account.id) },
      });
      return;
    }
    if (isManager || isRegisterHolder(session, userId)) {
      router.push(`/cash-session/${session.id}`);
      return;
    }
    toast.info(t("common:cashRegister.notYours"));
  };

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ScrollView
        contentContainerStyle={tw`px-4 pb-10 gap-4`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <DetailHeader title={t("common:cashRegister.title")} />

        {registers.length === 0 ? (
          <ThemedView style={tw`items-center py-12 gap-3`}>
            <Icon name="banknote" size={48} color={tw.color("gray-300")} />
            <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
              {isLoading
                ? t("common:status.loading")
                : t("common:cashRegister.noRegisters")}
            </ThemedText>
          </ThemedView>
        ) : (
          registers.map((register) => {
            const isOpen = !!register.session;
            return (
              <Card
                key={register.account.id}
                variant="outline"
                onPress={() => onPressRegister(register)}
              >
                <ThemedView style={tw`flex-row items-center gap-3`}>
                  <ThemedView style={tw`flex-1 gap-0.5`}>
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
                  </ThemedView>
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
              </Card>
            );
          })
        )}
      </ScrollView>
    </ScreenLayout>
  );
}
