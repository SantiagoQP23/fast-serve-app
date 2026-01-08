import React, { useCallback, useState } from "react";
import { ScrollView, RefreshControl, Alert } from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { useDailyReport } from "@/presentation/orders/hooks/useDailyReport";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import WaiterStatsCard from "@/presentation/reports/components/waiter-stats-card";
import { ReportMode } from "@/core/orders/dto/daily-report-filters.dto";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";
import ProgressBar from "@/presentation/theme/components/progress-bar";

export default function DailyReportScreen() {
  const { t } = useTranslation(["reports", "common"]);
  const primaryColor = useThemeColor({}, "primary");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch full report with order details
  const { dailyReport, isLoading, refetch } = useDailyReport({
    mode: ReportMode.FULL,
    includeOrderDetails: true,
  });

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await refetch();
    } catch (error) {
      Alert.alert(
        t("common:empty.noData"),
        t("reports:empty.noReportDescription"),
      );
    } finally {
      setRefreshing(false);
    }
  }, [refetch, t]);

  const summary = dailyReport?.summary;
  const waiterStats = dailyReport?.waiterStats || [];

  // Calculate collection rate (income vs amount)
  const collectionRate =
    summary && summary.totalAmount > 0
      ? summary.totalIncome / summary.totalAmount
      : 0;

  return (
    <ThemedView style={tw`flex-1 pt-4`}>
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
        {/* Summary Header */}
        <ThemedView style={tw` mb-6`}>
          <ThemedView style={tw`bg-primary-50 rounded-2xl p-4`}>
            <ThemedView style={tw`flex-row items-center justify-between mb-3`}>
              <ThemedText type="h3">{t("reports:summary.title")}</ThemedText>
              <ThemedView style={tw`bg-white rounded-full px-3 py-1`}>
                <ThemedText type="caption" style={tw`text-gray-600`}>
                  {dayjs(summary?.date).format("MMM DD, YYYY")}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            {isLoading ? (
              <ThemedView style={tw`py-8 items-center`}>
                <ThemedText type="body2" style={tw`text-gray-400`}>
                  {t("common:status.loading")}
                </ThemedText>
              </ThemedView>
            ) : (
              <ThemedView style={tw`gap-3`}>
                {/* Total Income - Full Width */}
                <ThemedView style={tw`bg-white rounded-xl p-4 shadow-sm`}>
                  <ThemedView style={tw`flex-row items-center justify-between`}>
                    <ThemedView style={tw`flex-1`}>
                      <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                        {t("reports:summary.totalIncome")}
                      </ThemedText>
                      <ThemedText type="h2" style={tw``}>
                        {formatCurrency(summary?.totalIncome ?? 0)}
                      </ThemedText>
                    </ThemedView>
                    <ThemedView
                      style={tw`w-12 h-12 rounded-full  items-center justify-center`}
                    >
                      <Ionicons
                        name="trending-up"
                        size={24}
                        color={tw.color("")}
                      />
                    </ThemedView>
                  </ThemedView>
                </ThemedView>

                {/* Total Amount - Full Width */}
                <ThemedView style={tw`bg-white rounded-xl p-4 shadow-sm`}>
                  <ThemedView style={tw`flex-row items-center justify-between`}>
                    <ThemedView style={tw`flex-1`}>
                      <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                        {t("reports:summary.totalAmount")}
                      </ThemedText>
                      <ThemedText type="h2" style={tw``}>
                        {formatCurrency(summary?.totalAmount ?? 0)}
                      </ThemedText>
                    </ThemedView>
                    <ThemedView
                      style={tw`w-12 h-12 rounded-full  items-center justify-center`}
                    >
                      <Ionicons name="cash" size={24} color={tw.color("")} />
                    </ThemedView>
                  </ThemedView>
                </ThemedView>

                {/* Collection Rate Progress */}
                <ThemedView style={tw`bg-white rounded-xl p-4 shadow-sm`}>
                  <ThemedView
                    style={tw`flex-row items-center justify-between mb-2`}
                  >
                    <ThemedText type="caption" style={tw`text-gray-500`}>
                      {t("reports:summary.collectionRate")}
                    </ThemedText>
                    <ThemedText
                      type="body2"
                      style={tw`font-semibold text-gray-700`}
                    >
                      {Math.round(collectionRate * 100)}%
                    </ThemedText>
                  </ThemedView>
                  <ProgressBar
                    progress={collectionRate}
                    height={1.5}
                    bgColor="bg-gray-200"
                  />
                  <ThemedView style={tw`flex-row justify-between mt-2`}>
                    <ThemedText type="small" style={tw`text-gray-400`}>
                      {t("reports:summary.collected")}:{" "}
                      {formatCurrency(summary?.totalIncome ?? 0)}
                    </ThemedText>
                    <ThemedText type="small" style={tw`text-gray-400`}>
                      {t("reports:summary.pending")}:{" "}
                      {formatCurrency(
                        (summary?.totalAmount ?? 0) -
                          (summary?.totalIncome ?? 0),
                      )}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                {/* Stats Row */}
                <ThemedView style={tw`flex-row gap-2`}>
                  <ThemedView
                    style={tw`flex-1 bg-white rounded-xl p-3 shadow-sm`}
                  >
                    <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                      {t("reports:summary.totalOrders")}
                    </ThemedText>
                    <ThemedText type="h3" style={tw``}>
                      {summary?.totalOrders ?? 0}
                    </ThemedText>
                  </ThemedView>

                  <ThemedView
                    style={tw`flex-1 bg-white rounded-xl p-3 shadow-sm`}
                  >
                    <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                      {t("reports:summary.totalBills")}
                    </ThemedText>
                    <ThemedText type="h3" style={tw``}>
                      {summary?.totalBills ?? 0}
                    </ThemedText>
                  </ThemedView>

                  <ThemedView
                    style={tw`flex-1 bg-white rounded-xl p-3 shadow-sm`}
                  >
                    <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                      {t("reports:summary.totalWaiters")}
                    </ThemedText>
                    <ThemedText type="h3" style={tw``}>
                      {summary?.totalWaiters ?? 0}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>

        {/* Waiter Statistics */}
        <ThemedView style={tw`px-4`}>
          <ThemedText type="h3" style={tw`mb-4`}>
            {t("reports:waiterStats.title")}
          </ThemedText>

          {isLoading ? (
            <ThemedView style={tw`py-8 items-center`}>
              <ThemedText type="body2" style={tw`text-gray-400`}>
                {t("common:status.loading")}
              </ThemedText>
            </ThemedView>
          ) : waiterStats.length > 0 ? (
            <ThemedView style={tw`gap-4`}>
              {waiterStats.map((waiter) => (
                <WaiterStatsCard key={waiter.userId} waiterStats={waiter} />
              ))}
            </ThemedView>
          ) : (
            <ThemedView style={tw`py-12 items-center`}>
              <Ionicons
                name="person-outline"
                size={60}
                color={tw.color("gray-400")}
              />
              <ThemedText type="h4" style={tw`text-gray-400 mt-4`}>
                {t("reports:waiterStats.noData")}
              </ThemedText>
              <ThemedText
                type="body2"
                style={tw`text-gray-400 text-center mt-2 max-w-xs`}
              >
                {t("reports:empty.noReportDescription")}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}
