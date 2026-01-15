import React from "react";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency, getPaymentMethodIcon, translatePaymentMethod } from "@/core/i18n/utils";
import { PaymentMethodStatsDto } from "@/core/orders/dto/payment-method-report-response.dto";
import { PaymentMethod } from "@/core/orders/enums/payment-method";
import ProgressBar from "@/presentation/theme/components/progress-bar";

interface PaymentMethodCardProps {
  paymentMethodStats: PaymentMethodStatsDto;
}

export default function PaymentMethodCard({ paymentMethodStats }: PaymentMethodCardProps) {
  const { t } = useTranslation(["reports", "common"]);

  const iconName = getPaymentMethodIcon(paymentMethodStats.paymentMethod);
  const methodName = translatePaymentMethod(paymentMethodStats.paymentMethod);

  return (
    <ThemedView style={tw`rounded-2xl border border-gray-200 shadow-sm overflow-hidden`}>
      <ThemedView style={tw`p-4 bg-white`}>
        {/* Header with icon and name */}
        <ThemedView style={tw`flex-row items-center mb-3 bg-transparent`}>
          <ThemedView
            style={tw`w-12 h-12 rounded-full bg-primary-50 items-center justify-center mr-3`}
          >
            <Ionicons
              name={iconName}
              size={24}
              color={tw.color("primary-600")}
            />
          </ThemedView>
          <ThemedView style={tw`flex-1 bg-transparent`}>
            <ThemedText type="h4">{methodName}</ThemedText>
            <ThemedText type="caption" style={tw`text-gray-500`}>
              {paymentMethodStats.billCount} {t("reports:paymentMethodStats.bills")}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Total Income - Highlighted */}
        <ThemedView style={tw`bg-primary-50 rounded-xl p-3 mb-3`}>
          <ThemedText type="caption" style={tw`text-gray-600 mb-1`}>
            {t("reports:paymentMethodStats.totalIncome")}
          </ThemedText>
          <ThemedText type="h2" style={tw`text-primary-700`}>
            {formatCurrency(paymentMethodStats.totalIncome)}
          </ThemedText>
        </ThemedView>

        {/* Stats Row */}
        <ThemedView style={tw`flex-row gap-2 mb-3`}>
            <ThemedView style={tw`flex-1 bg-gray-50 rounded-xl p-3`}>
              <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                {t("reports:paymentMethodStats.percentage")}
              </ThemedText>
              <ThemedText type="h3" style={tw`text-primary-700`}>
                {paymentMethodStats.percentage.toFixed(2)}%
              </ThemedText>
            </ThemedView>

            <ThemedView style={tw`flex-1 bg-gray-50 rounded-xl p-3`}>
              <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                {t("reports:paymentMethodStats.avgBillAmount")}
              </ThemedText>
              <ThemedText type="h3" style={tw`text-primary-700`}>
                {formatCurrency(paymentMethodStats.avgBillAmount)}
              </ThemedText>
            </ThemedView>
        </ThemedView>

        {/* Percentage Progress Bar */}
        <ThemedView style={tw`bg-transparent`}>
          <ThemedView style={tw`flex-row items-center justify-between mb-2`}>
            <ThemedText type="caption" style={tw`text-gray-500`}>
              {t("reports:paymentMethodStats.shareOfTotal")}
            </ThemedText>
            <ThemedText type="small" style={tw`font-semibold text-primary-700`}>
              {paymentMethodStats.percentage.toFixed(1)}%
            </ThemedText>
          </ThemedView>
          <ProgressBar
            progress={paymentMethodStats.percentage / 100}
            height={1.5}
            bgColor="bg-gray-200"
          />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
