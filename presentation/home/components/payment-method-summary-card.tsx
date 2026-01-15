import React from "react";
import { Pressable } from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency, getPaymentMethodIcon, translatePaymentMethod } from "@/core/i18n/utils";
import { usePaymentMethodReport } from "@/presentation/orders/hooks/usePaymentMethodReport";
import { useRouter } from "expo-router";
import { PaymentMethod } from "@/core/orders/enums/payment-method";

export default function PaymentMethodSummaryCard() {
  const { t } = useTranslation(["reports", "common"]);
  const { paymentMethodReport, isLoading } = usePaymentMethodReport();
  const router = useRouter();

  const handlePress = () => {
    router.push("/(reports)/payment-method-report");
  };

  // Get top 3 payment methods or all if less than 3
  const topPaymentMethods = paymentMethodReport?.paymentMethods?.slice(0, 3) || [];

  return (
    <Pressable onPress={handlePress}>
      <ThemedView
        style={tw`rounded-2xl border border-gray-300 p-4 shadow-sm mb-4`}
      >
        <ThemedView style={tw`flex-row items-center justify-between mb-3`}>
          <ThemedText type="h4">{t("reports:paymentMethodReport.title")}</ThemedText>
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
            {/* Total Income */}
            <ThemedView style={tw`flex-row justify-between`}>
              <ThemedView style={tw`flex-1 rounded-xl p-3`}>
                <ThemedText type="h3" style={tw``}>
                  {formatCurrency(paymentMethodReport?.summary?.totalIncome ?? 0)}
                </ThemedText>
                <ThemedText type="small" style={tw`text-gray-500 mb-1`}>
                  {t("reports:summary.totalIncome")}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            {/* Top Payment Methods */}
            {topPaymentMethods.length > 0 ? (
              <ThemedView style={tw`gap-2`}>
                {topPaymentMethods.map((method) => (
                  <ThemedView
                    key={method.paymentMethod}
                    style={tw`flex-row items-center justify-between p-2 bg-gray-50 rounded-lg`}
                  >
                    <ThemedView style={tw`flex-row items-center flex-1 bg-transparent`}>
                      <Ionicons
                        name={getPaymentMethodIcon(method.paymentMethod)}
                        size={20}
                        color={tw.color("primary-600")}
                        style={tw`mr-2`}
                      />
                      <ThemedView style={tw`flex-1 bg-transparent`}>
                        <ThemedText type="small" style={tw`text-gray-600`}>
                          {translatePaymentMethod(method.paymentMethod)}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                    <ThemedView style={tw`items-end bg-transparent`}>
                      <ThemedText type="body2" style={tw`font-semibold`}>
                        {formatCurrency(method.totalIncome)}
                      </ThemedText>
                      <ThemedText type="small" style={tw`text-gray-500`}>
                        {method.percentage.toFixed(1)}%
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                ))}
              </ThemedView>
            ) : (
              <ThemedView style={tw`py-4`}>
                <ThemedText type="body2" style={tw`text-gray-400 text-center`}>
                  {t("reports:paymentMethodReport.noData")}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        )}
      </ThemedView>
    </Pressable>
  );
}
