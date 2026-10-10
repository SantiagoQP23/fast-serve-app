import { Colors, typography } from "@/constants/theme";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

import { Stack } from "expo-router";
import { useEffect } from "react";

export default function OrdersLayout() {
  const { t } = useTranslation(["orders"]);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);

  useEffect(() => {
    return () => {
      setActiveOrder(null);
    };
  }, []);

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
        name="[id]/edit-order-detail/index"
        options={{
          headerShown: true,
          title: "",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="[id]/bills/index"
        options={{
          headerShown: true,
          title: "Payments",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="[id]/bills/new/index"
        options={{
          headerShown: true,
          title: "",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="[id]/tickets/index"
        options={{
          headerShown: true,
          title: "Order tickets",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="unprinted-tickets/index"
        options={{
          headerShown: true,
          title: t("orders:unprintedTickets.title"),
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
