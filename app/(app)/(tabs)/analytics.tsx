import { ScrollView, RefreshControl, Alert, Pressable } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";

import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useCallback, useState } from "react";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useQueryClient } from "@tanstack/react-query";
import StatsCard from "@/presentation/home/components/stats-card";
import { useDashboardStats } from "@/presentation/orders/hooks/useDashboardStats";
import { useActiveOrders } from "@/presentation/orders/hooks/useActiveOrders";
import ProgressBar from "@/presentation/theme/components/progress-bar";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { OrderPaymentStatus } from "@/core/orders/enums/order-payment-status.enum";
import OrderCardSkeleton from "@/presentation/home/components/order-card-skeleton";
import * as Haptics from "expo-haptics";

export default function AnalyticsScreen() {
  const { t } = useTranslation(["common", "errors"]);
  const { user, currentRestaurant } = useAuthStore();
  const allOrders = useOrdersStore((state) => state.orders);
  const isAdmin = user?.role?.name === "admin";

  // Use all orders for admin, personal orders for non-admin
  const orders = isAdmin
    ? allOrders
    : allOrders.filter((order) => order.user.id === user?.id);

  const primaryColor = useThemeColor({}, "primary");
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showTotalAmount, setShowTotalAmount] = useState(false);

  const {
    dashboardStats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useDashboardStats();

  const { isLoading: isLoadingOrders } = useActiveOrders({
    skipGlobalLoader: true,
  });

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const currencySymbol = t("common:currency.symbol");
  const totalAmountValue = dashboardStats?.totalAmount ?? 0;
  const formattedTotalAmount = `${currencySymbol}${totalAmountValue.toFixed(2)}`;

  const displayedTotalAmount = showTotalAmount
    ? formattedTotalAmount
    : formattedTotalAmount.replace(/\d/g, "*");

  return (
    <ThemedView style={tw`flex-1 bg-light-background`}>
      <ScrollView
        contentContainerStyle={tw`pb-20 gap-4`}
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
        <ThemedView style={tw`px-4 pt-4`}>
          <ThemedText type="h2">
            {isAdmin ? t("common:stats.analytics") : t("common:stats.myStats")}
          </ThemedText>
        </ThemedView>

        {isLoadingOrders || isLoadingStats ? (
          <ThemedView style={tw`px-4 gap-3`}>
            <OrderCardSkeleton />
            <OrderCardSkeleton />
            <OrderCardSkeleton />
          </ThemedView>
        ) : (
          <ThemedView style={tw`px-4 gap-4`}>
            {/* Total Amount */}
            <ThemedView style={tw`gap-4 rounded-lg`}>
              <ThemedView style={tw`bg-transparent gap-1`}>
                <ThemedView style={tw`flex-row items-center gap-2`}>
                  <ThemedText type="small">
                    {t("common:stats.totalAmount")}
                  </ThemedText>
                  <Pressable
                    onPress={() => setShowTotalAmount((prev) => !prev)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={
                        showTotalAmount ? "eye-off-outline" : "eye-outline"
                      }
                      size={18}
                      color={tw.color("gray-500")}
                    />
                  </Pressable>
                </ThemedView>
                <ThemedText style={tw`text-5xl`}>
                  {displayedTotalAmount}
                </ThemedText>
              </ThemedView>

              {/* Income Progress */}
              <ThemedView style={tw`gap-2`}>
                <ThemedView
                  style={tw`flex-row justify-between items-center gap-1`}
                >
                  <ThemedText type="small">
                    {t("common:stats.totalIncome")}
                  </ThemedText>
                  <ThemedText
                    type="body1"
                    style={tw`font-semibold text-light-primary`}
                  >
                    {`${t("common:currency.symbol")}${dashboardStats?.totalIncome?.toFixed(2) ?? "0.00"}`}
                  </ThemedText>
                </ThemedView>
                <ProgressBar
                  height={2}
                  progress={
                    (dashboardStats?.totalIncome || 0) /
                    (dashboardStats?.totalAmount || 1)
                  }
                />
              </ThemedView>
            </ThemedView>

            {/* Stats Cards Row */}
            <ThemedView style={tw`flex-row gap-4`}>
              <StatsCard
                title={t("common:stats.totalOrders")}
                value={dashboardStats?.totalOrders ?? 0}
                icon="receipt-outline"
                loading={isLoadingStats}
              />
              <StatsCard
                title={t("common:stats.ordersPendingPayment")}
                value={
                  orders.filter(
                    (order) =>
                      order.paymentStatus !== OrderPaymentStatus.PAID,
                  ).length
                }
                icon="receipt-outline"
                loading={isLoadingStats}
              />
            </ThemedView>
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}
