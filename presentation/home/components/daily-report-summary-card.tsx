import React from "react";
import { Pressable } from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { useDailyReport } from "@/presentation/orders/hooks/useDailyReport";
import { useRouter } from "expo-router";

export default function DailyReportSummaryCard() {
  const { t } = useTranslation(["reports", "common"]);
  const { dailyReport, isLoading } = useDailyReport();
  const router = useRouter();

  const handlePress = () => {
    router.push("/(reports)/daily-report");
  };

  return (
    <Pressable onPress={handlePress}>
      <ThemedView
        style={tw`rounded-2xl border border-gray-300 p-4 shadow-sm mb-4`}
      >
        <ThemedView style={tw`flex-row items-center justify-between mb-3`}>
          <ThemedText type="h4">{t("reports:summary.title")}</ThemedText>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={tw.color("gray-500")}
          />
        </ThemedView>

        {isLoading ? (
          <ThemedView style={tw`py-4`}>
            <ThemedText type="body2" style={tw`text-gray-400 text-center`}>
              {t("common:status.loading")}
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={tw`gap-3`}>
            <ThemedView style={tw`flex-row justify-between`}>
              <ThemedView style={tw`flex-1 bg-green-50 rounded-xl p-3`}>
                <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                  {t("reports:summary.totalIncome")}
                </ThemedText>
                <ThemedText type="h4" style={tw`text-green-700`}>
                  {formatCurrency(dailyReport?.summary?.totalIncome ?? 0)}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={tw`flex-row gap-2`}>
              <ThemedView style={tw`flex-1 bg-blue-50 rounded-xl p-3`}>
                <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                  {t("reports:summary.totalOrders")}
                </ThemedText>
                <ThemedText type="h4" style={tw`text-blue-700`}>
                  {dailyReport?.summary?.totalOrders ?? 0}
                </ThemedText>
              </ThemedView>

              <ThemedView style={tw`flex-1 bg-purple-50 rounded-xl p-3`}>
                <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                  {t("reports:summary.totalBills")}
                </ThemedText>
                <ThemedText type="h4" style={tw`text-purple-700`}>
                  {dailyReport?.summary?.totalBills ?? 0}
                </ThemedText>
              </ThemedView>

              <ThemedView style={tw`flex-1 bg-orange-50 rounded-xl p-3`}>
                <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                  {t("reports:summary.totalWaiters")}
                </ThemedText>
                <ThemedText type="h4" style={tw`text-orange-700`}>
                  {dailyReport?.summary?.totalWaiters ?? 0}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        )}
      </ThemedView>
    </Pressable>
  );
}
