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
import CircularProgressGauge from "@/presentation/theme/components/circular-progress-gauge";

export default function DailyReportSummaryCard() {
  const { t } = useTranslation(["reports", "common"]);
  const { dailyReport, isLoading } = useDailyReport();
  const router = useRouter();

  const handlePress = () => {
    router.push("/(reports)/daily-report");
  };

  const summary = dailyReport?.summary;

  // Calculate collection rate (income vs amount)
  const collectionRate =
    summary && summary.totalAmount > 0
      ? summary.totalIncome / summary.totalAmount
      : 0;

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
            {/* Circular Progress Gauge - Income vs Amount */}
            <ThemedView style={tw`items-center py-2`}>
              <CircularProgressGauge
                percentage={collectionRate * 100}
                currentValue={summary?.totalIncome ?? 0}
                goalValue={summary?.totalAmount ?? 0}
                currentLabel={t("reports:summary.collected")}
                goalLabel={t("reports:summary.totalAmount")}
                formatValue={(val) => formatCurrency(val)}
                size={160}
                strokeWidth={12}
              />
            </ThemedView>

            {/* Stats Row */}
          </ThemedView>
        )}
      </ThemedView>
    </Pressable>
  );
}
