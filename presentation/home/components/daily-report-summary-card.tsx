import React, { useState } from "react";
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
import ProgressBar from "@/presentation/theme/components/progress-bar";

export default function DailyReportSummaryCard({
  startDate,
  endDate,
  enableAmountVisibilityToggle = false,
}: {
  startDate?: string;
  endDate?: string;
  enableAmountVisibilityToggle?: boolean;
}) {
  const { t } = useTranslation(["reports", "common"]);
  const { dailyReport, isLoading } = useDailyReport(
    startDate && endDate ? { startDate, endDate } : undefined,
  );
  const router = useRouter();
  const [showAmounts, setShowAmounts] = useState(false);

  const handlePress = () => {
    router.push("/(reports)/daily-report");
  };

  const summary = dailyReport?.summary;
  const waiters = dailyReport?.waiterStats || [];

  // Calculate collection rate (income vs amount)
  const collectionRate =
    summary && summary.totalAmount > 0
      ? summary.totalIncome / summary.totalAmount
      : 0;
  const formatSummaryValue = (value: number) => {
    const formattedValue = formatCurrency(value);
    return showAmounts ? formattedValue : formattedValue.replace(/\d/g, "*");
  };

  const formatWaiterValue = (value: number) => {
    const formattedValue = formatCurrency(value);
    return showAmounts ? formattedValue : formattedValue.replace(/\d/g, "*");
  };

  return (
    <Pressable>
      <ThemedView style={tw`rounded-2xl border border-light-border p-4  mb-4`}>
         <ThemedView style={tw`flex-row items-center justify-between mb-3`}>
           <ThemedText type="h3">{t("reports:summary.title")}</ThemedText>
           {enableAmountVisibilityToggle && (
             <Pressable
               onPress={() => setShowAmounts((prev) => !prev)}
               hitSlop={8}
             >
               <Ionicons
                 name={showAmounts ? "eye-off-outline" : "eye-outline"}
                 size={18}
                 color={tw.color("gray-500")}
               />
             </Pressable>
           )}
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
                formatValue={formatSummaryValue}
                size={160}
                strokeWidth={12}
              />
            </ThemedView>

            {/* Stats Row */}
            {/* <ThemedText>{JSON.stringify(waiters)}</ThemedText> */}
            <ThemedView style={tw`gap-4`}>
              {waiters.map((waiter) => (
                <ThemedView key={waiter.userId} style={tw` gap-2`}>
                  <ThemedView style={tw`gap-1`}>
                    <ThemedText type="body2">{waiter.fullName}</ThemedText>
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      Orders: {waiter.totalOrders}
                    </ThemedText>
                  </ThemedView>
                  <ThemedView
                     style={tw`flex-row gap-4 items-center justify-between`}
                   >
                     <ThemedText type="small">
                       {formatWaiterValue(waiter.totalIncome)}
                     </ThemedText>
                     <ThemedText type="small">
                       {formatWaiterValue(waiter.totalAmount)}
                     </ThemedText>
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
          </ThemedView>
        )}
      </ThemedView>
    </Pressable>
  );
}
