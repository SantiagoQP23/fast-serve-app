import { ScrollView, RefreshControl, Alert, Pressable } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";

import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useCallback, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useQueryClient } from "@tanstack/react-query";
import StatsCard from "@/presentation/home/components/stats-card";
import { useDashboardStats } from "@/presentation/orders/hooks/useDashboardStats";
import { useActiveOrders } from "@/presentation/orders/hooks/useActiveOrders";
import ProgressBar from "@/presentation/theme/components/progress-bar";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { OrderPaymentStatus } from "@/core/orders/enums/order-payment-status.enum";
import OrderCardSkeleton from "@/presentation/home/components/order-card-skeleton";
import * as Haptics from "expo-haptics";
import DailyReportSummaryCard from "@/presentation/home/components/daily-report-summary-card";
import { useDailyReport } from "@/presentation/orders/hooks/useDailyReport";
import { formatCurrency } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Card from "@/presentation/theme/components/card";
import { typography } from "@/constants/theme";
import Chip from "@/presentation/theme/components/chip";
import {
  DateRangeFilter,
  getDateRangeFor,
} from "@/core/orders/enums/date-range-filter.enum";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import CustomDateRangeBottomSheet from "@/presentation/orders/components/custom-date-range-bottom-sheet";
import BestSellingProductsCard from "@/presentation/home/components/best-selling-products-card";
import BestSellingCategoriesCard from "@/presentation/home/components/best-selling-categories-card";
import Button from "@/presentation/theme/components/button";
import Label from "@/presentation/theme/components/label";

export default function AnalyticsScreen() {
  const { t } = useTranslation(["common", "errors", "reports"]);
  const { user, currentRestaurant } = useAuthStore();
  const allOrders = useOrdersStore((state) => state.orders);
  const isAdmin = isAdminLevelRole(user?.role?.name);

  // Admins can toggle between restaurant-wide data and their own data.
  // Non-admins always see their own data (enforced by the backend).
  const [viewOnlyMine, setViewOnlyMine] = useState(false);

  // Use all orders for admin (unless scoped to "only me"), personal orders for non-admin
  const orders =
    isAdmin && !viewOnlyMine
      ? allOrders
      : allOrders.filter((order) => order.user?.id === user?.id);

  const primaryColor = useThemeColor({}, "primary");
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showTotalAmount, setShowTotalAmount] = useState(false);

  const [selectedDateRangeFilter, setSelectedDateRangeFilter] =
    useState<DateRangeFilter>(DateRangeFilter.TODAY);
  const [customRange, setCustomRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>();
  const customRangeSheetRef = useRef<BottomSheetMethods>(null);

  const dateRangeChips = [
    { filter: DateRangeFilter.TODAY, label: t("common:stats.dateRange.today") },
    {
      filter: DateRangeFilter.WEEK_TO_DATE,
      label: t("common:stats.dateRange.weekToDate"),
    },
    {
      filter: DateRangeFilter.MONTH_TO_DATE,
      label: t("common:stats.dateRange.monthToDate"),
    },
    {
      filter: DateRangeFilter.YEAR_TO_DATE,
      label: t("common:stats.dateRange.yearToDate"),
    },
    {
      filter: DateRangeFilter.CUSTOM,
      label: t("common:stats.dateRange.custom"),
    },
  ];

  const handleSelectDateRangeFilter = (filter: DateRangeFilter) => {
    if (filter === DateRangeFilter.CUSTOM) {
      customRangeSheetRef.current?.present();
      return;
    }
    setSelectedDateRangeFilter(filter);
  };

  const handleApplyCustomRange = (range: {
    startDate: Date;
    endDate: Date;
  }) => {
    setCustomRange(range);
    setSelectedDateRangeFilter(DateRangeFilter.CUSTOM);
  };

  const dateRange = useMemo(
    () => getDateRangeFor(selectedDateRangeFilter, customRange),
    [selectedDateRangeFilter, customRange],
  );

  const statsUserId = isAdmin && viewOnlyMine ? user?.id : undefined;

  const {
    dashboardStats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useDashboardStats(dateRange, statsUserId);

  const { isLoading: isLoadingOrders } = useActiveOrders();

  const { dailyReport } = useDailyReport({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
  const reportWaiters = dailyReport?.waiterStats || [];

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Promise.all([
        refetchStats(),
        queryClient.invalidateQueries({ queryKey: ["dailyReport"] }),
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
    <ScreenLayout style={tw`flex-1 bg-light-background pt-4`}>
      <ThemedView style={tw`px-4 py-4 gap-3`}>
        <ThemedView style={tw`flex-row items-center justify-between`}>
          <ThemedText type="h2">
            {isAdmin ? t("common:stats.analytics") : t("common:stats.myStats")}
          </ThemedText>
          {isAdmin && (
            <ThemedView style={tw`flex-row gap-2`}>
              {viewOnlyMine ? (
                <Label
                  text={t("common:stats.viewScope.mine")}
                  size="small"
                  onPress={() => setViewOnlyMine(false)}
                />
              ) : (
                <Label
                  text={t("common:stats.viewScope.mine")}
                  size="small"
                  onPress={() => setViewOnlyMine(true)}
                  color="outline"
                />
              )}
            </ThemedView>
          )}
        </ThemedView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw`gap-2`}
        >
          {dateRangeChips.map(({ filter, label }) => (
            <Chip
              key={filter}
              label={label}
              selected={selectedDateRangeFilter === filter}
              onPress={() => handleSelectDateRangeFilter(filter)}
            />
          ))}
        </ScrollView>
      </ThemedView>
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
                      name={showTotalAmount ? "eye-off-outline" : "eye-outline"}
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
                title={t("common:stats.ordersQuantity")}
                value={dashboardStats?.ordersQuantity ?? 0}
                icon="receipt-outline"
                loading={isLoadingStats}
              />
              <StatsCard
                title={t("common:stats.ordersPendingPayment")}
                value={
                  orders.filter(
                    (order) => order.paymentStatus !== OrderPaymentStatus.PAID,
                  ).length
                }
                icon="receipt-outline"
                loading={isLoadingStats}
              />
            </ThemedView>

            {/* Sales Cards Row */}
            <ThemedView style={tw`flex-row gap-4`}>
              <StatsCard
                title={t("common:stats.salesQuantity")}
                value={dashboardStats?.salesQuantity ?? 0}
                icon="cash-outline"
                loading={isLoadingStats}
              />
              <StatsCard
                title={t("common:stats.totalSales")}
                value={formatCurrency(dashboardStats?.totalSales ?? 0)}
                icon="cash-outline"
                loading={isLoadingStats}
              />
            </ThemedView>

            {/* Best Selling Products & Categories */}
            <BestSellingProductsCard
              dateRange={dateRange}
              userId={statsUserId}
            />
            <BestSellingCategoriesCard
              dateRange={dateRange}
              userId={statsUserId}
            />
          </ThemedView>
        )}

        {/* {isAdmin && ( */}
        {/*   <ThemedView style={tw`px-4 pt-2`}> */}
        {/*     <DailyReportSummaryCard enableAmountVisibilityToggle /> */}
        {/*   </ThemedView> */}
        {/* )} */}

        {isAdmin && reportWaiters.length > 0 && (
          <ThemedView style={tw`px-4`}>
            <Card style={tw``}>
              <ThemedText type="h4" style={tw`mb-3`}>
                {t("reports:waiterStats.title")}
              </ThemedText>
              <ThemedView style={tw`gap-4`}>
                {reportWaiters.map((waiter) => (
                  <ThemedView key={waiter.userId} style={tw`gap-2`}>
                    <ThemedView
                      style={tw`flex-row justify-between items-center`}
                    >
                      <ThemedView style={tw`gap-1`}>
                        <ThemedText
                          type="body2"
                          style={{ fontFamily: typography.medium }}
                        >
                          {waiter.fullName}
                        </ThemedText>
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          {waiter.totalOrders} {t("reports:waiterStats.orders")}
                          {" · "}
                          {formatCurrency(waiter.totalIncome)}
                        </ThemedText>
                      </ThemedView>

                      <ThemedView
                        style={tw`flex-row gap-1 items-center justify-end`}
                      >
                        <ThemedText type="body2">
                          {formatCurrency(waiter.totalAmount)}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                    <ProgressBar
                      height={2}
                      progress={
                        (waiter?.totalIncome || 0) / (waiter?.totalAmount || 1)
                      }
                    />
                  </ThemedView>
                ))}
              </ThemedView>
            </Card>
          </ThemedView>
        )}

        <ThemedView style={tw`px-4`}>
          <Card onPress={() => router.push("/(profile)/history")}>
            <ThemedView style={tw`flex-row items-center gap-3`}>
              <Ionicons
                name="time-outline"
                size={22}
                color={tw.color("gray-500")}
              />
              <ThemedView style={tw`flex-1`}>
                <ThemedText type="body1">
                  {t("common:stats.orderHistory")}
                </ThemedText>
              </ThemedView>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color={tw.color("gray-400")}
              />
            </ThemedView>
          </Card>
        </ThemedView>
      </ScrollView>

      <ThemedBottomSheetModal ref={customRangeSheetRef} enablePanDownToClose>
        <CustomDateRangeBottomSheet
          onClose={() => customRangeSheetRef.current?.dismiss()}
          onApply={handleApplyCustomRange}
          initialStartDate={customRange?.startDate}
          initialEndDate={customRange?.endDate}
        />
      </ThemedBottomSheetModal>
    </ScreenLayout>
  );
}
