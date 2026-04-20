import React, { useState } from "react";
import { Pressable } from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  formatCurrency,
  translatePaymentMethod,
  getPaymentMethodInfo,
} from "@/core/i18n/utils";
import { useTransactionPaymentMethodReport } from "@/presentation/transactions/hooks/useTransactionPaymentMethodReport";
import { useRouter } from "expo-router";
import { PieChart } from "react-native-gifted-charts";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/presentation/theme/hooks/use-color-scheme";

export default function PaymentMethodSummaryCard({
  startDate,
  endDate,
}: {
  startDate?: string;
  endDate?: string;
}) {
  const { t } = useTranslation(["reports", "common", "bills"]);
  const [showTotalIncome, setShowTotalIncome] = useState(false);
  const { paymentMethodReport, isLoading } = useTransactionPaymentMethodReport(
    startDate && endDate ? { startDate, endDate } : undefined,
  );
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themePrimaryColor =
    colorScheme === "dark" ? Colors.dark.primary : Colors.light.primary;

  const handlePress = () => {
    router.push("/(reports)/payment-method-report");
  };

  // Payment method data
  const paymentMethods = paymentMethodReport?.report || [];

  // Prepare pie chart data
  const pieData = paymentMethods.map((pm) => {
    const info = getPaymentMethodInfo(pm.paymentMethodType);
    const percentage = paymentMethodReport?.summary?.totalIncome
      ? (pm.totalIncome / paymentMethodReport.summary.totalIncome) * 100
      : 0;

    return {
      value: pm.totalIncome,
      color: info.color,
      text: `${percentage.toFixed(0)}%`,
    };
  });
  const formattedTotalIncome = formatCurrency(
    paymentMethodReport?.summary?.totalIncome ?? 0,
  );
  const displayedTotalIncome = showTotalIncome
    ? formattedTotalIncome
    : formattedTotalIncome.replace(/\d/g, "*");

  return (
    <Pressable>
      <ThemedView style={tw`rounded-2xl border border-light-border p-4  mb-4`}>
        <ThemedView style={tw`flex-row items-center justify-between mb-3`}>
          <ThemedText type="h4" style={tw`font-bold`}>
            {t("reports:paymentMethodReport.title")}
          </ThemedText>
          <Pressable
            onPress={() => setShowTotalIncome((prev) => !prev)}
            hitSlop={8}
          >
            <Ionicons
              name={showTotalIncome ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={tw.color("gray-500")}
            />
          </Pressable>
        </ThemedView>
        {/* <ThemedText>{JSON.stringify(paymentMethods)}</ThemedText> */}

        {isLoading ? (
          <ThemedView style={tw`py-4`}>
            <ThemedText type="body2" style={tw`text-gray-400 text-center`}>
              {t("common:status.loading")}
            </ThemedText>
          </ThemedView>
        ) : paymentMethods.length > 0 ? (
          <ThemedView style={tw`gap-3`}>
            {/* Donut Chart */}
            <ThemedView style={tw`items-center`}>
              <PieChart
                data={pieData}
                donut
                radius={100}
                innerRadius={65}
                innerCircleColor="#fff"
                centerLabelComponent={() => (
                  <ThemedView style={tw`items-center bg-transparent`}>
                    <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                      {t("reports:summary.totalIncome")}
                    </ThemedText>
                    <ThemedText
                      type="h3"
                      style={[tw`font-bold`, { color: themePrimaryColor }]}
                    >
                      {displayedTotalIncome}
                    </ThemedText>
                  </ThemedView>
                )}
                textSize={12}
                textColor="#fff"
                showText
                textBackgroundRadius={10}
                strokeWidth={2}
                strokeColor="#fff"
              />
            </ThemedView>

            {/* Legend */}
            <ThemedView style={tw`gap-2`}>
              {paymentMethods.map((pm) => {
                const info = getPaymentMethodInfo(pm.paymentMethodType);
                const percentage = paymentMethodReport?.summary?.totalIncome
                  ? (pm.totalIncome / paymentMethodReport.summary.totalIncome) *
                    100
                  : 0;
                const formattedPaymentMethodIncome = formatCurrency(
                  pm.totalIncome,
                );
                const displayedPaymentMethodIncome = showTotalIncome
                  ? formattedPaymentMethodIncome
                  : formattedPaymentMethodIncome.replace(/\d/g, "*");

                return (
                  <ThemedView key={pm.paymentMethodId}>
                    <ThemedView
                      style={tw`flex-row items-center justify-between`}
                    >
                      <ThemedView
                        style={tw`flex-row items-center gap-2 flex-1`}
                      >
                        <ThemedView
                          style={[
                            tw`w-3 h-3 rounded-full`,
                            { backgroundColor: info.color },
                          ]}
                        />
                        <ThemedView style={tw`gap-1`}>
                          <ThemedText type="body2" style={tw`flex-1`}>
                            {pm.paymentMethodName}
                          </ThemedText>
                          <ThemedView style={tw`flex-row items-center gap-1.5`}>
                            <ThemedText type="small" style={tw`text-gray-500`}>
                              {pm.transactionCount}{" "}
                              {pm.transactionCount === 1
                                ? t("bills:bill")
                                : t("bills:bills")}
                            </ThemedText>
                            <ThemedText type="small" style={tw`text-gray-400`}>
                              •
                            </ThemedText>
                            <ThemedText type="small" style={tw`text-gray-500`}>
                              {percentage.toFixed(1)}%
                            </ThemedText>
                          </ThemedView>
                        </ThemedView>
                      </ThemedView>
                      <ThemedView style={tw`items-end gap-0.5`}>
                        <ThemedText type="body2" style={tw`font-semibold`}>
                          {displayedPaymentMethodIncome}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>

                    <ThemedView style={tw`ml-5 mt-1 p-1`}>
                      {pm.incomeByAccount.map((account) => {
                        const totalIncome = showTotalIncome
                          ? formatCurrency(account.totalIncome)
                          : formattedPaymentMethodIncome.replace(/\d/g, "*");

                        return (
                          <ThemedView
                            key={account.accountId}
                            style={tw`flex-row items-center justify-between gap-1`}
                          >
                            <ThemedText type="small">
                              {account.accountName}
                            </ThemedText>
                            <ThemedText type="small">{totalIncome}</ThemedText>
                          </ThemedView>
                        );
                      })}
                    </ThemedView>
                  </ThemedView>
                );
              })}
            </ThemedView>
          </ThemedView>
        ) : (
          <ThemedView style={tw`py-4`}>
            <ThemedText type="body2" style={tw`text-gray-400 text-center`}>
              {t("reports:paymentMethodReport.noData")}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </Pressable>
  );
}
