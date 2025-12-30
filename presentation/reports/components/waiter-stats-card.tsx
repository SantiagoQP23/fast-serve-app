import React, { useState } from "react";
import { Pressable } from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { WaiterStatsDto } from "@/core/orders/dto/daily-report-response.dto";
import OrderSummaryCard from "@/presentation/reports/components/order-summary-card";

interface WaiterStatsCardProps {
  waiterStats: WaiterStatsDto;
}

export default function WaiterStatsCard({ waiterStats }: WaiterStatsCardProps) {
  const { t } = useTranslation(["reports", "common"]);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <ThemedView
      style={tw`rounded-2xl border border-gray-300 shadow-sm overflow-hidden`}
    >
      <Pressable onPress={toggleExpand}>
        <ThemedView style={tw`p-4 bg-gray-50`}>
          <ThemedView
            style={tw`flex-row justify-between items-center mb-3 bg-transparent`}
          >
            <ThemedView style={tw`flex-1 bg-transparent`}>
              <ThemedText type="h4">{waiterStats.fullName}</ThemedText>
              <ThemedText type="caption" style={tw`text-gray-500`}>
                {waiterStats.roleName}
              </ThemedText>
            </ThemedView>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={tw.color("gray-500")}
            />
          </ThemedView>

          <ThemedView style={tw`flex-row gap-2 rounded-lg`}>
            <ThemedView style={tw`flex-1 bg-white rounded-xl p-3`}>
              <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                {t("reports:waiterStats.income")}
              </ThemedText>
              <ThemedText type="body1" style={tw`font-semibold text-green-700`}>
                {formatCurrency(waiterStats.totalIncome)}
              </ThemedText>
            </ThemedView>

            <ThemedView style={tw`flex-1 bg-white rounded-xl p-3`}>
              <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                {t("reports:waiterStats.orders")}
              </ThemedText>
              <ThemedText type="body1" style={tw`font-semibold text-blue-700`}>
                {waiterStats.totalOrders}
              </ThemedText>
            </ThemedView>

            <ThemedView style={tw`flex-1 bg-white rounded-xl p-3`}>
              <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                {t("reports:waiterStats.bills")}
              </ThemedText>
              <ThemedText
                type="body1"
                style={tw`font-semibold text-purple-700`}
              >
                {waiterStats.totalBills}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Pressable>

      {isExpanded && (
        <ThemedView style={tw`p-4 border-t border-gray-200`}>
          {waiterStats.orders.length > 0 ? (
            <ThemedView style={tw`gap-3`}>
              {waiterStats.orders.map((order) => (
                <OrderSummaryCard key={order.id} order={order} />
              ))}
            </ThemedView>
          ) : (
            <ThemedView style={tw`py-4`}>
              <ThemedText type="body2" style={tw`text-gray-400 text-center`}>
                {t("reports:orderSummary.noOrders")}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      )}
    </ThemedView>
  );
}
