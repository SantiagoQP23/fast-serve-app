import { ScrollView, RefreshControl, Alert } from "react-native";

import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";

import Fab from "@/presentation/theme/components/fab";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import IconButton from "@/presentation/theme/components/icon-button";
import NotificationBadge from "@/presentation/theme/components/notification-badge";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import OrderList from "@/presentation/orders/molecules/order-list";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useQueryClient } from "@tanstack/react-query";
import StatsCard from "@/presentation/home/components/stats-card";
import { useDashboardStats } from "@/presentation/orders/hooks/useDashboardStats";
import DailyReportSummaryCard from "@/presentation/home/components/daily-report-summary-card";

export default function HomeScreen() {
  const { t } = useTranslation(["common", "orders", "errors"]);
  const { user } = useAuthStore();
  const orders = useOrdersStore((state) => state.orders).filter(
    (order) => order.user.id === user?.id,
  );
  const router = useRouter();
  const details = useNewOrderStore((state) => state.details);
  const queryClient = useQueryClient();
  const { currentRestaurant } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const primaryColor = useThemeColor({}, "primary");
  const {
    dashboardStats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useDashboardStats();

  // ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handleNavigate = () => {
    bottomSheetModalRef.current?.close(); // Close sheet before navigating
    router.push("/restaurant-menu"); // Navigate to New Order screen
  };

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      // Trigger haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Refetch orders and stats using the centralized query
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["activeOrders", currentRestaurant?.id],
        }),
        refetchStats(),
      ]);
    } catch {
      Alert.alert(
        t("errors:order.fetchError"),
        t("errors:order.ordersFetchFailed"),
      );
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, currentRestaurant?.id, t, refetchStats]);

  const pendingOrders = orders.filter(
    (order) => order.status === OrderStatus.PENDING,
  );
  const inProgressOrders = orders.filter(
    (order) => order.status === OrderStatus.IN_PROGRESS,
  );
  const deliveredOrders = orders.filter(
    (order) => order.status === OrderStatus.DELIVERED,
  );

  const haveAnOpenOrder = details.length > 0;

  return (
    <ThemedView style={tw` pt-8 flex-1 `}>
      <ThemedView style={tw`mb-6 px-4`}>
        <ThemedView
          style={tw`absolute  rounded-full items-center justify-center  z-10 right-2 top-2`}
        >
          {haveAnOpenOrder && (
            <ThemedView style={tw`relative`}>
              <IconButton
                icon="cart-outline"
                onPress={() => router.push("/(new-order)/cart")}
              />
              <NotificationBadge value={details.length} />
            </ThemedView>
          )}
        </ThemedView>
        <ThemedText type="body1">{t("common:greetings.hello")}</ThemedText>
        <ThemedText type="h2" style={tw`mt-1`}>
          {user?.person.firstName}
        </ThemedText>
      </ThemedView>

      {/* Stats Cards */}

      <ScrollView
        contentContainerStyle={tw`pb-20`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
      >
        <ThemedView style={tw`px-4 mb-4`}>
          <ThemedView style={tw`flex-row gap-3`}>
            <StatsCard
              title={t("common:stats.totalOrders")}
              value={dashboardStats?.totalOrders ?? 0}
              icon="receipt-outline"
              iconColor="#3b82f6"
              loading={isLoadingStats}
            />
            <StatsCard
              title={t("common:stats.totalAmount")}
              value={`${t("common:currency.symbol")}${dashboardStats?.totalAmount?.toFixed(2) ?? "0.00"}`}
              icon="cash-outline"
              iconColor="#10b981"
              loading={isLoadingStats}
            />
          </ThemedView>
        </ThemedView>

        {/* Daily Report Summary */}
        <ThemedView style={tw`px-4`}>
          <DailyReportSummaryCard />
        </ThemedView>

        {orders.length === 0 ? (
          <ThemedView
            style={tw` items-center justify-center flex-1 gap-4 mt-20`}
          >
            <Ionicons
              name="document-text-outline"
              size={80}
              color={tw.color("gray-500")}
            />
            <ThemedText type="h3">{t("orders:list.noOrders")}</ThemedText>
            <ThemedText type="body2" style={tw`text-center max-w-xs`}>
              {t("orders:list.noOrdersDescription")}
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={tw`gap-4`}>
            <OrderList
              title={t("common:status.pending")}
              orders={pendingOrders}
            />
            <OrderList
              title={t("common:status.inProgress")}
              orders={inProgressOrders}
            />
            <OrderList
              title={t("common:status.delivered")}
              orders={deliveredOrders}
            />
          </ThemedView>
        )}
      </ScrollView>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        onChange={handleSheetChanges}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
      >
        <NewOrderBottomSheet onCreateOrder={handleNavigate} />
      </BottomSheetModal>
      <Fab icon="add-outline" onPress={handlePresentModalPress} />
    </ThemedView>
  );
}
