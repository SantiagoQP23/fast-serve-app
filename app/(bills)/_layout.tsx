import { Colors, typography } from "@/constants/theme";
import { Stack } from "expo-router";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

export default function BillsLayout() {
  const { t } = useTranslation(["bills"]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: Colors.light.background },
        headerTitleStyle: { fontFamily: typography.medium },
      }}
    >
      <Stack.Screen
        name="[id]/index"
        options={{
          headerShown: true,
          title: "",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="[id]/edit/index"
        options={{
          headerShown: true,
          title: "",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="[id]/payment-method/index"
        options={{
          headerShown: true,
          title: t("bills:details.paymentMethod"),
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="[id]/payment-method/account/index"
        options={{
          headerShown: true,
          title: t("bills:account.selectAccountTitle"),
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
