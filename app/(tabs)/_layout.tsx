import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/presentation/theme/hooks/use-color-scheme";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useEffect } from "react";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ActivityIndicator } from "react-native";
import {
  useOrderCreatedListener,
  useOrderDeletedListener,
  useOrders,
  useOrderUpdatedListener,
} from "@/presentation/orders/hooks/useOrders";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

export default function TabLayout() {
  const { t } = useTranslation("common");
  const colorScheme = useColorScheme();
  const { status, checkStatus, user } = useAuthStore();
  const order = useOrdersStore((state) => state.activeOrder);
  useOrders();
  useOrderCreatedListener();
  useOrderUpdatedListener();
  useOrderDeletedListener();

  // Check if user is admin
  const isAdmin = user?.role?.name === "admin";

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  if (status === "checking") {
    return (
      <ThemedView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 5,
        }}
      >
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (status === "unauthenticated") {
    return <Redirect href="/auth/login" />;
  }

  // activeOrdersQuery.refetch();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].primary,
        headerShown: false,
        // tabBarActiveTintColor: Colors["light"].tint,
        // tabBarStyle: {
        //   backgroundColor: Colors["light"].background,
        // },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("navigation.home"),
          tabBarIcon: ({ color }) => (
            <Ionicons color={color} name="home-outline" size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("navigation.dashboard"),
          tabBarIcon: ({ color }) => (
            <Ionicons color={color} name="stats-chart-outline" size={24} />
          ),
          href: isAdmin ? "/(tabs)/dashboard" : null,
        }}
      />
      <Tabs.Screen
        name="tables"
        options={{
          title: t("navigation.tables"),
          tabBarIcon: ({ color }) => (
            <Ionicons color={color} name="grid-outline" size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t("navigation.orders"),
          tabBarIcon: ({ color }) => (
            <Ionicons color={color} name="receipt-outline" size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("navigation.profile"),
          // headerShown: true,
          tabBarIcon: ({ color }) => (
            <Ionicons color={color} name="person-outline" size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="tables/[tableId]/index"
        options={{
          title: "",
          tabBarButton: () => null,
          // headerShown: true,
        }}
      />
    </Tabs>
  );
}
