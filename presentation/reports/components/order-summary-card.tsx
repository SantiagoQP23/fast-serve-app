import React, { useState } from "react";
import { Pressable } from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { WaiterOrderDto } from "@/core/orders/dto/daily-report-response.dto";
import dayjs from "dayjs";
import BillItem from "@/presentation/reports/components/bill-item";

interface OrderSummaryCardProps {
  order: WaiterOrderDto;
}

export default function OrderSummaryCard({ order }: OrderSummaryCardProps) {
  const { t } = useTranslation(["reports", "common"]);
  const [billsExpanded, setBillsExpanded] = useState(false);

  const totalItems = order.details.reduce(
    (sum, detail) => sum + detail.quantity,
    0,
  );
  const hasBills = order.bills && order.bills.length > 0;

  const toggleBills = () => {
    setBillsExpanded(!billsExpanded);
  };

  return (
    <ThemedView style={tw`border border-gray-200 rounded-xl p-3`}>
      <ThemedView style={tw`flex-row justify-between items-start mb-2`}>
        <ThemedView style={tw`flex-1`}>
          <ThemedText type="body1" style={tw`font-semibold`}>
            {t("reports:orderSummary.orderNumber", { num: order.num })}
          </ThemedText>
          <ThemedView style={tw`flex-row items-center gap-2 mt-1`}>
            <ThemedText type="caption" style={tw`text-gray-500`}>
              {order.tableName
                ? `${t("tables:details.table", { name: order.tableName })}`
                : t("reports:orderSummary.takeAway")}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={tw`items-end`}>
          <ThemedText type="body1" style={tw`font-semibold text-primary-700`}>
            {formatCurrency(order.total)}
          </ThemedText>
          <ThemedText type="caption" style={tw`text-gray-500`}>
            {dayjs(order.createdAt).format("HH:mm")}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={tw`flex-row gap-2 flex-wrap`}>
        {order.isPaid && (
          <ThemedView
            style={tw`flex-row items-center gap-1 bg-green-50 px-2 rounded-full`}
          >
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={tw.color("green-600")}
            />
            <ThemedText type="caption" style={tw`text-green-600`}>
              {t("common:status.paid")}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>

      {/* Bills Section */}
      {hasBills && (
        <ThemedView style={tw`mt-3 pt-3 border-t border-gray-200`}>
          <Pressable onPress={toggleBills}>
            <ThemedView style={tw`flex-row justify-between items-center mb-2`}>
              <ThemedText
                type="caption"
                style={tw`font-semibold text-primary-700`}
              >
                {t("reports:billDetails.title", { count: order.bills.length })}
              </ThemedText>
              <Ionicons
                name={billsExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color={tw.color("gray-500")}
              />
            </ThemedView>
          </Pressable>

          {billsExpanded && (
            <ThemedView style={tw`gap-2 mt-2`}>
              {order.bills.map((bill) => (
                <BillItem key={bill.id} bill={bill} />
              ))}
            </ThemedView>
          )}
        </ThemedView>
      )}
    </ThemedView>
  );
}
