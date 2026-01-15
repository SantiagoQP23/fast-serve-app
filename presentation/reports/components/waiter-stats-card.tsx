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
import ProgressBar from "@/presentation/theme/components/progress-bar";

interface WaiterStatsCardProps {
  waiterStats: WaiterStatsDto;
}

export default function WaiterStatsCard({ waiterStats }: WaiterStatsCardProps) {
  const { t } = useTranslation(["reports", "common"]);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Calculate collection rate for this waiter
  const collectionRate =
    waiterStats.totalAmount > 0
      ? waiterStats.totalIncome / waiterStats.totalAmount
      : 0;

  return (
    <ThemedView
      style={tw`rounded-2xl border border-gray-200 shadow-sm overflow-hidden`}
    >
      <Pressable onPress={toggleExpand}>
        <ThemedView style={tw`p-4 bg-white`}>
          {/* Header with icon and name */}
          <ThemedView
            style={tw`flex-row items-center justify-between mb-4 bg-transparent`}
          >
            <ThemedView style={tw`flex-row items-center flex-1`}>
              <ThemedView
                style={tw`w-12 h-12 rounded-full bg-primary-50 items-center justify-center mr-3`}
              >
                <Ionicons
                  name="person"
                  size={24}
                  color={tw.color("primary-600")}
                />
              </ThemedView>
              <ThemedView style={tw`flex-1 bg-transparent`}>
                <ThemedText type="h4">{waiterStats.fullName}</ThemedText>
                <ThemedText type="caption" style={tw`text-gray-500`}>
                  {waiterStats.roleName}
                </ThemedText>
              </ThemedView>
            </ThemedView>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={tw.color("gray-500")}
            />
          </ThemedView>

          {/* Income vs Amount with Progress Bar */}
          <ThemedView style={tw`bg-light-surface rounded-xl p-4`}>
            {/* Values Row */}
            <ThemedView
              style={tw`flex-row justify-between mb-3 bg-transparent`}
            >
              <ThemedView style={tw`flex-1 bg-transparent`}>
                <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                  {t("reports:waiterStats.income")}
                </ThemedText>
                <ThemedText type="h3" style={tw`text-primary-700`}>
                  {formatCurrency(waiterStats.totalIncome)}
                </ThemedText>
              </ThemedView>

              <ThemedView style={tw`flex-1 items-end bg-transparent`}>
                <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                  {t("reports:waiterStats.amount")}
                </ThemedText>
                <ThemedText type="h3" style={tw`text-gray-700`}>
                  {formatCurrency(waiterStats.totalAmount)}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            {/* Progress Bar */}
            <ThemedView style={tw`bg-transparent`}>
              <ThemedView
                style={tw`flex-row items-center justify-end mb-2 bg-transparent`}
              >
                <ThemedText
                  type="small"
                  style={tw`font-semibold text-primary-700`}
                >
                  {Math.round(collectionRate * 100)}%
                </ThemedText>
              </ThemedView>
              <ProgressBar
                progress={collectionRate}
                height={2}
                bgColor="bg-gray-200"
              />
            </ThemedView>

            {/* Stats Summary */}
            <ThemedView
              style={tw`flex-row justify-between mt-3 pt-3 border-t border-gray-200 bg-transparent`}
            >
              <ThemedText type="small" style={tw`text-gray-600`}>
                {waiterStats.totalOrders} {t("reports:waiterStats.orders")}
              </ThemedText>
              <ThemedText type="small" style={tw`text-gray-600`}>
                {waiterStats.totalBills} {t("reports:waiterStats.bills")}
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
