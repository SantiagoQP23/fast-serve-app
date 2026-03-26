import { Redirect, Tabs, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/presentation/theme/hooks/use-color-scheme";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useEffect, useRef } from "react";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ActivityIndicator, View } from "react-native";
import {
  useOrderCreatedListener,
  useOrderDeletedListener,
  useOrders,
  useOrderUpdatedListener,
} from "@/presentation/orders/hooks/useOrders";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import IconButton from "@/presentation/theme/components/icon-button";
import tw from "@/presentation/theme/lib/tailwind";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import useOrdersModuleContext from "./(orders-module)/orders-module.context";
import NotificationBadge from "@/presentation/theme/components/notification-badge";
import { getRoutes } from "expo-router/build/getRoutesCore";
import { ROUTES } from "@/constants/routes";

function MyOrdersHeaderRight() {
  const router = useRouter();
  const details = useNewOrderStore((state) => state.details);
  const haveAnOpenOrder = details.length > 0;
  const { openViewPopover } = useOrdersModuleContext();
  const moreButtonRef = useRef<View>(null);

  const handleMorePress = () => {
    moreButtonRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      openViewPopover({ x: pageX, y: pageY, width, height });
    });
  };

  return (
    <View style={tw`flex-row items-center gap-4 mr-2`}>
      {haveAnOpenOrder && (
        <ThemedView style={tw``}>
          <IconButton
            icon="cart-outline"
            onPress={() => router.push("/(new-order)/cart")}
          />
          <NotificationBadge value={details.length} />
        </ThemedView>
      )}
      <View ref={moreButtonRef} collapsable={false}>
        <IconButton icon="ellipsis-vertical" onPress={handleMorePress} />
      </View>
    </View>
  );
}

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
    return <Redirect href={ROUTES.AUTH.LOGIN} />;
  }

  // activeOrdersQuery.refetch();

  return (
    <ThemedView style={tw`flex-1 bg-light-background `}>
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
          name="(orders-module)"
          options={{
            title: t("navigation.home"),
            tabBarIcon: ({ color }) => (
              <Ionicons color={color} name="home-outline" size={24} />
            ),
            headerShown: true,
            headerShadowVisible: false,
            headerRight: () => <MyOrdersHeaderRight />,
          }}
        />
        <Tabs.Screen
          name="sales"
          options={{
            title: t("navigation.sales"),
            tabBarIcon: ({ color }) => (
              <Ionicons color={color} name="pricetag-outline" size={24} />
            ),
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
          name="incomes"
          options={{
            title: t("navigation.incomes"),
            tabBarIcon: ({ color }) => (
              <Ionicons color={color} name="stats-chart-outline" size={24} />
            ),
            href: isAdmin ? "/(app)/(tabs)/incomes" : null,
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
      </Tabs>
    </ThemedView>
  );
}
