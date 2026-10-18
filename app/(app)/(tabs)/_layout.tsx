import { Redirect, Tabs, useNavigation, useRouter } from "expo-router";
import Icon from "@/presentation/theme/components/icon";

import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
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
import { useRevalidateOfflineSession } from "@/presentation/auth/hooks/useRevalidateOfflineSession";
import { useOutboxRunner } from "@/presentation/offline/hooks/useOutboxRunner";
import { useOutboxCounts } from "@/presentation/offline/hooks/useOrderSyncState";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import IconButton from "@/presentation/theme/components/icon-button";
import tw from "@/presentation/theme/lib/tailwind";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import useOrdersModuleContext from "./(orders-module)/orders-module.context";
import NotificationBadge from "@/presentation/theme/components/notification-badge";
import { ROUTES } from "@/constants/routes";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useUnprintedTickets } from "@/presentation/orders/hooks/useUnprintedTickets";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";
import { usePalette } from "@/presentation/theme/store/useThemeStore";

export function MyOrdersHeaderRight() {
  const router = useRouter();
  const details = useNewOrderStore((state) => state.details);
  const haveAnOpenOrder = details.length > 0;
  const unprintedTicketsCount = useUnprintedTickets().length;
  const restaurantId = useAuthStore((state) => state.currentRestaurant?.id);
  const unsynced = useOutboxCounts(restaurantId);
  const { openViewPopover } = useOrdersModuleContext();
  const moreButtonRef = useRef<View>(null);

  const handleMorePress = () => {
    moreButtonRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      openViewPopover({ x: pageX, y: pageY, width, height });
    });
  };

  return (
    <View style={tw`flex-row items-center gap-4 mr-2`}>
      <ThemedView style={tw``}>
        <IconButton
          icon="printer"
          onPress={() => router.push("/(order)/unprinted-tickets")}
        />
        <NotificationBadge value={unprintedTicketsCount} />
      </ThemedView>
      {unsynced.total > 0 && (
        <ThemedView style={tw``}>
          <IconButton
            icon={
              unsynced.failed > 0 ? "circle-alert" : "cloud-upload"
            }
            onPress={() => router.push("/(order)/pending-changes")}
          />
          <NotificationBadge
            value={unsynced.total}
            style={unsynced.failed > 0 ? "bg-red-500" : ""}
          />
        </ThemedView>
      )}
      {haveAnOpenOrder && (
        <ThemedView style={tw``}>
          <IconButton
            icon="shopping-cart"
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
  const palette = usePalette();
  const { t } = useTranslation("common");
  const { status, checkStatus, user, bootstrapStatus } = useAuthStore();
  // useOrders();
  // useOrderCreatedListener();
  // useOrderUpdatedListener();
  // useOrderDeletedListener();
  useSync();
  useSyncEventListener();
  useRevalidateOfflineSession();
  useOutboxRunner();

  // const { printComanda } = usePrintComanda();
  // useNewTicketListener(printComanda);

  // Check if user has admin-level access (admin or owner)
  const isAdmin = isAdminLevelRole(user?.role?.name);

  // Tablet in landscape (counter/POS): navigation rail on the left
  const { isTablet, isLandscape } = useResponsiveLayout();
  const isRail = isTablet && isLandscape;

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

  if (!user?.role) {
    return <Redirect href={ROUTES.NO_RESTAURANT} />;
  }

  // activeOrdersQuery.refetch();

  return (
    <ThemedView style={tw`flex-1 bg-background `}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: palette.onSecondary,
          tabBarInactiveTintColor: palette.onSurfaceVariant,
          // tabBarActiveBackgroundColor: palette.surface,
          headerShown: false,
          headerStyle: {
            backgroundColor: palette.background,
          },
          // tabBarActiveTintColor: palette.tint,
          tabBarPosition: isRail ? "left" : "bottom",
          tabBarVariant: isRail ? "material" : "uikit",
          tabBarLabelPosition: "below-icon",
          // The icon renders its own active pill
          tabBarActiveBackgroundColor: "transparent",
          tabBarStyle: isRail
            ? {
                backgroundColor: palette.surface,
                width: 112,
                paddingTop: 24,
                // Override the sidebar's default paddingStart/End
                paddingStart: 4,
                paddingEnd: 4,
                borderRightWidth: 0,
                elevation: 0,
              }
            : {
                backgroundColor: palette.surface,
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
          tabBarItemStyle: isRail
            ? {
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 8,
                marginVertical: 4,
              }
            : {
                justifyContent: "center",
                alignItems: "center",
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
              <ThemedText type="small" style={{ color, marginTop: 6 }}>
                {t("navigation.home")}
              </ThemedText>
            ),
            tabBarIcon: ({ color, focused }) => (
              <ThemedView
                style={tw`items-center justify-center ${focused ? "bg-secondary" : ""} w-15 h-8 rounded-full`}
              >
                <Icon
                  color={color}
                  name="house"
                  size={24}
                />
              </ThemedView>
            ),
            headerShown: false,
            headerShadowVisible: false,
            title: `${t("common:greetings.hello")} ${user?.person?.firstName}!`,
            headerRight: () => <MyOrdersHeaderRight />,
          }}
        />
        <Tabs.Screen
          name="inventory"
          options={{
            tabBarLabel: ({ color }) => (
              <ThemedText type="small" style={{ color, marginTop: 6 }}>
                {t("navigation.inventory")}
              </ThemedText>
            ),
            tabBarIcon: ({ color, focused }) => (
              <ThemedView
                style={tw`items-center justify-center ${focused ? "bg-secondary" : ""} w-15 h-8 rounded-full`}
              >
                <Icon
                  color={color}
                  name="package"
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
              <ThemedText type="small" style={{ color, marginTop: 6 }}>
                {t("navigation.analytics")}
              </ThemedText>
            ),
            tabBarIcon: ({ color, focused }) => (
              <ThemedView
                style={tw`items-center justify-center ${focused ? "bg-secondary" : ""} w-15 h-8 rounded-full`}
              >
                <Icon
                  color={color}
                  name="trending-up"
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
              <ThemedText type="small" style={{ color, marginTop: 6 }}>
                {t("navigation.incomes")}
              </ThemedText>
            ),
            tabBarIcon: ({ color, focused }) => (
              <ThemedView
                style={tw`items-center justify-center ${focused ? "bg-secondary" : ""} w-15 h-8 rounded-full`}
              >
                <Icon
                  color={color}
                  name="chart-column"
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
              <ThemedText type="small" style={{ color, marginTop: 6 }}>
                {t("navigation.manage")}
              </ThemedText>
            ),
            tabBarIcon: ({ color, focused }) => (
              <ThemedView
                style={tw`items-center justify-center ${focused ? "bg-secondary" : ""} w-15 h-8 rounded-full`}
              >
                <Icon
                  color={color}
                  name="grip"
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
