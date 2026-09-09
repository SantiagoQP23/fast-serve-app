import { Redirect, Tabs, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/presentation/theme/hooks/use-color-scheme";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useEffect, useRef } from "react";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ActivityIndicator, Pressable, View } from "react-native";
import {
  useOrderCreatedListener,
  useOrderDeletedListener,
  useOrders,
  useOrderUpdatedListener,
} from "@/presentation/orders/hooks/useOrders";
import { useSync } from "@/presentation/sync/hooks/useSync";
import { useSyncEventListener } from "@/presentation/sync/hooks/useSyncEventListener";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import IconButton from "@/presentation/theme/components/icon-button";
import tw from "@/presentation/theme/lib/tailwind";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import useOrdersModuleContext from "./(orders-module)/orders-module.context";
import NotificationBadge from "@/presentation/theme/components/notification-badge";
import { ROUTES } from "@/constants/routes";
import { ThemedText } from "@/presentation/theme/components/themed-text";

export function MyOrdersHeaderRight() {
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
      {/* <View ref={moreButtonRef} collapsable={false}> */}
      {/*   <IconButton icon="ellipsis-vertical" onPress={handleMorePress} /> */}
      {/* </View> */}
    </View>
  );
}

export default function TabLayout() {
  const { t } = useTranslation("common");
  const colorScheme = useColorScheme();
  const { status, checkStatus, user, bootstrapStatus } = useAuthStore();
  // useOrders();
  // useOrderCreatedListener();
  // useOrderUpdatedListener();
  // useOrderDeletedListener();
  useSync({ showGlobalLoader: true });
  useSyncEventListener();

  // const { printComanda } = usePrintComanda();
  // useNewTicketListener(printComanda);

  // Check if user is admin
  const isAdmin = user?.role?.name === "admin";

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  if (status === "checking" || bootstrapStatus === "loading") {
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
          tabBarActiveTintColor: Colors.light.onSecondary,
          tabBarInactiveTintColor: Colors.light.onSurfaceVariant,
          // tabBarActiveBackgroundColor: Colors.light.surface,
          headerShown: false,
          headerStyle: {
            backgroundColor: Colors.light.background,
          },
          // tabBarActiveTintColor: Colors["light"].tint,
          tabBarStyle: {
            backgroundColor: Colors["light"].surface,
            paddingTop: 5,
            paddingBottom: 0,
            borderRadius: 20,
            shadowColor: "transparent",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
            elevation: 0,
            borderTopWidth: 0,
          },
          tabBarItemStyle: {
            justifyContent: "center",
            alignItems: "center",
            gap: 4,
            paddingVertical: 0,
          },
          tabBarButton: (props) => (
            <Pressable {...props} android_ripple={{ color: "transparent" }} />
          ),
        }}
      >
        <Tabs.Screen
          name="(orders-module)"
          options={{
            tabBarLabel: ({ color }) => (
              <ThemedText type="small" style={{ color }}>
                {t("navigation.home")}
              </ThemedText>
            ),
            tabBarIcon: ({ color, focused }) => (
              <ThemedView
                style={tw`items-center justify-center ${focused ? "bg-light-secondary" : ""} w-15 h-8 rounded-full`}
              >
                <Ionicons
                  color={color}
                  name={focused ? "home" : "home-outline"}
                  size={24}
                />
              </ThemedView>
            ),
            headerShown: false,
            headerShadowVisible: false,
            title: `${t("common:greetings.hello")} ${user?.person.firstName}!`,
            headerRight: () => <MyOrdersHeaderRight />,
          }}
        />
        <Tabs.Screen
          name="sales"
          options={{
            tabBarLabel: ({ color }) => (
              <ThemedText type="small" style={{ color }}>
                {t("navigation.sales")}
              </ThemedText>
            ),
            tabBarIcon: ({ color, focused }) => (
              <ThemedView
                style={tw`items-center justify-center ${focused ? "bg-light-secondary" : ""} w-15 h-8 rounded-full`}
              >
                <Ionicons
                  color={color}
                  name={focused ? "pricetag" : "pricetag-outline"}
                  size={24}
                />
              </ThemedView>
            ),
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            tabBarLabel: ({ color }) => (
              <ThemedText type="small" style={{ color }}>
                {t("navigation.analytics")}
              </ThemedText>
            ),
            tabBarIcon: ({ color, focused }) => (
              <ThemedView
                style={tw`items-center justify-center ${focused ? "bg-light-secondary" : ""} w-15 h-8 rounded-full`}
              >
                <Ionicons
                  color={color}
                  name={focused ? "trending-up" : "trending-up-outline"}
                  size={24}
                />
              </ThemedView>
            ),
          }}
        />
        <Tabs.Screen
          name="incomes"
          options={{
            tabBarLabel: ({ color }) => (
              <ThemedText type="small" style={{ color }}>
                {t("navigation.incomes")}
              </ThemedText>
            ),
            tabBarIcon: ({ color, focused }) => (
              <ThemedView
                style={tw`items-center justify-center ${focused ? "bg-light-secondary" : ""} w-15 h-8 rounded-full`}
              >
                <Ionicons
                  color={color}
                  name={focused ? "stats-chart" : "stats-chart-outline"}
                  size={24}
                />
              </ThemedView>
            ),
            href: isAdmin ? "/incomes" : null,
          }}
        />
        <Tabs.Screen
          name="manage"
          options={{
            tabBarLabel: ({ color }) => (
              <ThemedText type="small" style={{ color }}>
                {t("navigation.manage")}
              </ThemedText>
            ),
            tabBarIcon: ({ color, focused }) => (
              <ThemedView
                style={tw`items-center justify-center ${focused ? "bg-light-secondary" : ""} w-15 h-8 rounded-full`}
              >
                <Ionicons
                  color={color}
                  name={focused ? "apps" : "apps-outline"}
                  size={24}
                />
              </ThemedView>
            ),
          }}
        />
      </Tabs>
    </ThemedView>
  );
}
