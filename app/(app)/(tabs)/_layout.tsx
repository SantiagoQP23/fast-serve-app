import { useShakeToSync } from "@/presentation/sync/hooks/useShakeToSync";
import { useCashSessionsRealtime } from "@/presentation/cash-sessions/hooks/useCashSessions";
import { Redirect, Tabs, useNavigation } from "expo-router";
import Icon from "@/presentation/theme/components/icon";

import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useEffect } from "react";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import {
  ActivityIndicator,
  ColorValue,
  Pressable,
  useWindowDimensions,
} from "react-native";
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
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import tw from "@/presentation/theme/lib/tailwind";
import { ROUTES } from "@/constants/routes";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";
import { usePalette } from "@/presentation/theme/store/useThemeStore";
import CashRegistersButton from "@/presentation/cash-sessions/components/cash-registers-button";

// The draft order/sale shows as a section on Home (DraftOrderSection);
// unprinted tickets and unsynced changes as pills under the tabs
// (PendingStatusRow)
export function MyOrdersHeaderRight() {
  return <CashRegistersButton />;
}

// Bottom tab bar sizing. The bar sets its own height (instead of the default
// 49pt + bottom inset) because the root SafeAreaView already keeps it above
// the system navigation bar / home indicator, and the default height is too
// short for the icon pill plus a label below it, which clipped the labels on
// devices with a small bottom inset or a larger system font size.
const TAB_BAR_PADDING_VERTICAL = 6;
const TAB_ICON_PILL_HEIGHT = 32; // h-8
const TAB_LABEL_MARGIN_TOP = 6;
const TAB_LABEL_LINE_HEIGHT = 16; // ThemedText "small"
const TAB_LABEL_MAX_FONT_SCALE = 1.3;

function TabBarLabel({ color, label }: { color: ColorValue; label: string }) {
  return (
    <ThemedText
      type="small"
      numberOfLines={1}
      adjustsFontSizeToFit
      maxFontSizeMultiplier={TAB_LABEL_MAX_FONT_SCALE}
      style={{ color, marginTop: TAB_LABEL_MARGIN_TOP }}
    >
      {label}
    </ThemedText>
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
  // Registers open/close on other devices (pay flow, Ingresos).
  useCashSessionsRealtime();
  useRevalidateOfflineSession();
  useOutboxRunner();
  useShakeToSync();

  // const { printComanda } = usePrintComanda();
  // useNewTicketListener(printComanda);

  // Tablet in landscape (counter/POS): navigation rail on the left
  const { isTablet, isLandscape } = useResponsiveLayout();
  const isRail = isTablet && isLandscape;

  const { fontScale } = useWindowDimensions();
  const tabBarHeight =
    TAB_BAR_PADDING_VERTICAL * 2 +
    TAB_ICON_PILL_HEIGHT +
    TAB_LABEL_MARGIN_TOP +
    Math.ceil(
      TAB_LABEL_LINE_HEIGHT * Math.min(fontScale, TAB_LABEL_MAX_FONT_SCALE),
    );

  useEffect(() => {
    // Right after login or a restaurant switch the session was just
    // confirmed and its data loaded; checking again would repeat it all.
    if (useAuthStore.getState().status === "checking") checkStatus();
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
                backgroundColor: palette.surfaceBright,
                height: tabBarHeight,
                paddingTop: TAB_BAR_PADDING_VERTICAL,
                paddingBottom: TAB_BAR_PADDING_VERTICAL,
                shadowColor: "transparent",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0,
                shadowRadius: 0,
                elevation: 0,
                borderTopWidth: 1,
                borderTopColor: palette.border,
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
              <TabBarLabel color={color} label={t("navigation.home")} />
            ),
            tabBarIcon: ({ color, focused }) => (
              <ThemedView
                style={tw`items-center justify-center ${focused ? "bg-secondary" : ""} w-15 h-8 rounded-full`}
              >
                <Icon color={color} name="house" size={24} />
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
              <TabBarLabel color={color} label={t("navigation.inventory")} />
            ),
            tabBarIcon: ({ color, focused }) => (
              <ThemedView
                style={tw`items-center justify-center ${focused ? "bg-secondary" : ""} w-15 h-8 rounded-full`}
              >
                <Icon color={color} name="package" size={24} />
              </ThemedView>
            ),
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            tabBarLabel: ({ color }) => (
              <TabBarLabel color={color} label={t("navigation.analytics")} />
            ),
            tabBarIcon: ({ color, focused }) => (
              <ThemedView
                style={tw`items-center justify-center ${focused ? "bg-secondary" : ""} w-15 h-8 rounded-full`}
              >
                <Icon color={color} name="trending-up" size={24} />
              </ThemedView>
            ),
          }}
        />
        <Tabs.Screen
          name="incomes"
          options={{
            tabBarLabel: ({ color }) => (
              <TabBarLabel color={color} label={t("navigation.incomes")} />
            ),
            tabBarIcon: ({ color, focused }) => (
              <ThemedView
                style={tw`items-center justify-center ${focused ? "bg-secondary" : ""} w-15 h-8 rounded-full`}
              >
                <Icon color={color} name="chart-column" size={24} />
              </ThemedView>
            ),
          }}
        />
        <Tabs.Screen
          name="manage"
          options={{
            tabBarLabel: ({ color }) => (
              <TabBarLabel color={color} label={t("navigation.manage")} />
            ),
            tabBarIcon: ({ color, focused }) => (
              <ThemedView
                style={tw`items-center justify-center ${focused ? "bg-secondary" : ""} w-15 h-8 rounded-full`}
              >
                <Icon color={color} name="grip" size={24} />
              </ThemedView>
            ),
          }}
        />
      </Tabs>
    </ThemedView>
  );
}
