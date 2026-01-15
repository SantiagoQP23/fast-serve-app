import React, { useCallback, useState, useMemo } from "react";
import { ScrollView, RefreshControl, Alert } from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  formatCurrency,
  getPaymentMethodInfo,
  translatePaymentMethod,
} from "@/core/i18n/utils";
import { usePaymentMethodReport } from "@/presentation/orders/hooks/usePaymentMethodReport";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";
import { PieChart } from "react-native-gifted-charts";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "react-native";

export default function PaymentMethodReportScreen() {
  const { t } = useTranslation(["reports", "common"]);
  const primaryColor = useThemeColor({}, "primary");
  const colorScheme = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);

  // Get theme primary color
  const themePrimaryColor =
    colorScheme === "dark" ? Colors.dark.primary : Colors.light.primary;

  // Fetch payment method report
  const { paymentMethodReport, isLoading, refetch } = usePaymentMethodReport();

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

  const summary = paymentMethodReport?.summary;
  const paymentMethods = paymentMethodReport?.paymentMethods || [];

  // Transform data for pie chart
  const pieData = useMemo(() => {
    return paymentMethods.map((method) => {
      const info = getPaymentMethodInfo(method.paymentMethod);
      return {
        value: method.totalIncome,
        text: `${method.percentage.toFixed(1)}%`,
        color: info.color,
        focused: false,
      };
    });
  }, [paymentMethods]);

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
        <ThemedView style={tw`px-4 mb-4`}>
          <ThemedView style={tw`bg-primary-50 rounded-2xl `}>
            <ThemedView style={tw`flex-row items-center justify-between `}>
              <ThemedText type="h3">
                {t("reports:paymentMethodReport.title")}
              </ThemedText>
              <ThemedView style={tw`bg-white rounded-full `}>
                <ThemedText type="caption" style={tw`text-gray-600`}>
                  {summary?.startDate && summary?.endDate
                    ? dayjs(summary.startDate).format("MMM DD") ===
                      dayjs(summary.endDate).format("MMM DD")
                      ? dayjs(summary.startDate).format("MMM DD, YYYY")
                      : `${dayjs(summary.startDate).format("MMM DD")} - ${dayjs(summary.endDate).format("MMM DD, YYYY")}`
                    : t("common:date.today")}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {isLoading ? (
          <ThemedView style={tw`py-8 items-center`}>
            <ThemedText type="body2" style={tw`text-gray-400`}>
              {t("common:status.loading")}
            </ThemedText>
          </ThemedView>
        ) : paymentMethods.length > 0 ? (
          <ThemedView style={tw`px-4 gap-6`}>
            {/* Pie Chart with Legend */}
            <ThemedView style={tw`bg-white rounded-2xl p-6 shadow-sm`}>
              {/* Donut Chart */}
              <ThemedView style={tw`items-center mb-6`}>
                <PieChart
                  data={pieData}
                  donut
                  radius={120}
                  innerRadius={75}
                  innerCircleColor="#fff"
                  centerLabelComponent={() => (
                    <ThemedView style={tw`items-center bg-transparent`}>
                      <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                        {t("reports:summary.totalIncome")}
                      </ThemedText>
                      <ThemedText
                        type="h2"
                        style={[tw`font-bold`, { color: themePrimaryColor }]}
                      >
                        {formatCurrency(summary?.totalIncome ?? 0)}
                      </ThemedText>
                    </ThemedView>
                  )}
                  textSize={14}
                  textColor="#fff"
                  showText
                  textBackgroundRadius={12}
                  strokeWidth={2}
                  strokeColor="#fff"
                />
              </ThemedView>

              {/* Legend */}
              <ThemedView style={tw` pt-4`}>
                <ThemedView style={tw`gap-3`}>
                  {paymentMethods.map((method) => {
                    const info = getPaymentMethodInfo(method.paymentMethod);
                    const methodName = translatePaymentMethod(
                      method.paymentMethod,
                    );
                    return (
                      <ThemedView
                        key={method.paymentMethod}
                        style={tw`flex-row items-center justify-between`}
                      >
                        <ThemedView style={tw`flex-row items-center flex-1`}>
                          <ThemedView
                            style={[
                              tw`w-4 h-4 rounded-full mr-3`,
                              { backgroundColor: info.color },
                            ]}
                          />
                          <ThemedView style={tw`flex-1`}>
                            <ThemedText type="body1" style={tw`font-semibold`}>
                              {methodName}
                            </ThemedText>
                            <ThemedText type="small" style={tw`text-gray-500`}>
                              {method.billCount}{" "}
                              {t("reports:paymentMethodStats.bills")}
                            </ThemedText>
                          </ThemedView>
                        </ThemedView>
                        <ThemedView style={tw`items-end`}>
                          <ThemedText
                            type="body1"
                            style={[
                              tw`font-semibold`,
                              { color: themePrimaryColor },
                            ]}
                          >
                            {formatCurrency(method.totalIncome)}
                          </ThemedText>
                          <ThemedText type="caption" style={tw`text-gray-500`}>
                            {method.percentage.toFixed(1)}%
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>
                    );
                  })}
                </ThemedView>
              </ThemedView>
              <ThemedView style={tw`flex-1  mt-4`}>
                <ThemedText type="small" style={tw`text-gray-500 `}>
                  {t("reports:summary.totalBills")}: {summary?.totalBills ?? 0}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        ) : (
          <ThemedView style={tw`py-12 items-center`}>
            <Ionicons
              name="wallet-outline"
              size={60}
              color={tw.color("gray-400")}
            />
            <ThemedText type="h4" style={tw`text-gray-400 mt-4`}>
              {t("reports:paymentMethodReport.noData")}
            </ThemedText>
            <ThemedText
              type="body2"
              style={tw`text-gray-400 text-center mt-2 max-w-xs`}
            >
              {t("reports:empty.noReportDescription")}
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}
