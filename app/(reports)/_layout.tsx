import { Stack, useRouter } from "expo-router";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import IconButton from "@/presentation/theme/components/icon-button";

export default function ReportsLayout() {
  const { t } = useTranslation("reports");
  const tBills = useTranslation("bills").t;
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen
        name="daily-report/index"
        options={{
          title: t("titles.dailyReport"),
          headerShown: true,
          headerShadowVisible: false,
          headerLeft: () => (
            <IconButton
              icon="arrow-back"
              onPress={() => router.back()}
              style={{ marginRight: 10 }}
            />
          ),
        }}
      />
      <Stack.Screen
        name="payment-method-report/index"
        options={{
          title: t("titles.paymentMethodReport"),
          headerShown: true,
          headerShadowVisible: false,
          headerLeft: () => (
            <IconButton
              icon="arrow-back"
              onPress={() => router.back()}
              style={{ marginRight: 10 }}
            />
          ),
        }}
      />
      <Stack.Screen
        name="bills-list/index"
        options={{
          title: tBills("bills:list.allBills"),
          headerShown: true,
          headerShadowVisible: false,
          headerLeft: () => (
            <IconButton
              icon="arrow-back"
              onPress={() => router.back()}
              style={{ marginRight: 10 }}
            />
          ),
        }}
      />
    </Stack>
  );
}
