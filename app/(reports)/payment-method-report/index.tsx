import React, { useCallback, useState } from "react";
import { ScrollView, RefreshControl, Alert } from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { usePaymentMethodReport } from "@/presentation/orders/hooks/usePaymentMethodReport";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import PaymentMethodCard from "@/presentation/reports/components/payment-method-card";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";

export default function PaymentMethodReportScreen() {
  const { t } = useTranslation(["reports", "common"]);
  const primaryColor = useThemeColor({}, "primary");
  const [refreshing, setRefreshing] = useState(false);

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
              <ThemedText type="h3">
                {t("reports:paymentMethodReport.title")}
              </ThemedText>
              <ThemedView style={tw`bg-white rounded-full px-3 py-1`}>
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
                      <ThemedText type="h2" style={tw`text-primary-700`}>
                        {formatCurrency(summary?.totalIncome ?? 0)}
                      </ThemedText>
                    </ThemedView>
                    <ThemedView
                      style={tw`w-12 h-12 rounded-full items-center justify-center`}
                    >
                      <Ionicons
                        name="trending-up"
                        size={24}
                        color={tw.color("primary-600")}
                      />
                    </ThemedView>
                  </ThemedView>
                </ThemedView>

                {/* Total Bills */}
                <ThemedView style={tw`bg-white rounded-xl p-4 shadow-sm`}>
                  <ThemedView style={tw`flex-row items-center justify-between`}>
                    <ThemedView style={tw`flex-1`}>
                      <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                        {t("reports:summary.totalBills")}
                      </ThemedText>
                      <ThemedText type="h2" style={tw`text-primary-700`}>
                        {summary?.totalBills ?? 0}
                      </ThemedText>
                    </ThemedView>
                    <ThemedView
                      style={tw`w-12 h-12 rounded-full items-center justify-center`}
                    >
                      <Ionicons
                        name="receipt"
                        size={24}
                        color={tw.color("primary-600")}
                      />
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>

        {/* Payment Methods */}
        <ThemedView style={tw`px-4`}>
          <ThemedText type="h3" style={tw`mb-4`}>
            {t("reports:paymentMethodReport.byPaymentMethod")}
          </ThemedText>

          {isLoading ? (
            <ThemedView style={tw`py-8 items-center`}>
              <ThemedText type="body2" style={tw`text-gray-400`}>
                {t("common:status.loading")}
              </ThemedText>
            </ThemedView>
          ) : paymentMethods.length > 0 ? (
            <ThemedView style={tw`gap-4`}>
              {paymentMethods.map((method) => (
                <PaymentMethodCard
                  key={method.paymentMethod}
                  paymentMethodStats={method}
                />
              ))}
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
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}
