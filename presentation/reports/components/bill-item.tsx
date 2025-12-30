import React from "react";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { WaiterBillDto } from "@/core/orders/dto/daily-report-response.dto";
import dayjs from "dayjs";

interface BillItemProps {
  bill: WaiterBillDto;
}

// Map payment method to icon, color, and translation key
const getPaymentMethodInfo = (paymentMethod: string) => {
  const method = paymentMethod.toUpperCase();

  switch (method) {
    case "CASH":
      return {
        icon: "cash-outline" as const,
        key: "cash",
        color: "#10b981", // green-600
        bgColor: "bg-green-50",
      };
    case "CREDIT_CARD":
      return {
        icon: "card-outline" as const,
        key: "creditCard",
        color: "#3b82f6", // blue-600
        bgColor: "bg-blue-50",
      };
    case "TRANSFER":
      return {
        icon: "swap-horizontal-outline" as const,
        key: "transfer",
        color: "#8b5cf6", // purple-600
        bgColor: "bg-purple-50",
      };
    default:
      return {
        icon: "wallet-outline" as const,
        key: "cash",
        color: "#6b7280", // gray-600
        bgColor: "bg-gray-50",
      };
  }
};

export default function BillItem({ bill }: BillItemProps) {
  const { t } = useTranslation(["reports", "bills"]);

  const paymentInfo = getPaymentMethodInfo(bill.paymentMethod);
  const paymentMethodLabel = t(`bills:paymentMethods.${paymentInfo.key}`);
  const time = dayjs(bill.createdAt).format("HH:mm");

  return (
    <ThemedView
      style={tw`  py-3 px-3 bg-white border border-gray-200 rounded-xl shadow-sm`}
    >
      <ThemedView style={tw`flex-row justify-between mb-2`}>
        {/* Bill Number */}
        <ThemedView
          style={tw`flex-row items-center gap-2 bg-transparent min-w-16`}
        >
          <ThemedView
            style={tw`w-7 h-7 rounded-full bg-gray-100 items-center justify-center`}
          >
            <Ionicons
              name="receipt-outline"
              size={16}
              color={tw.color("gray-700")}
            />
          </ThemedView>
          <ThemedText type="caption" style={tw`text-gray-900 font-bold`}>
            #{bill.num}
          </ThemedText>
        </ThemedView>
        {/* Total */}
        <ThemedView style={tw`items-end bg-transparent min-w-20 ml-2`}>
          <ThemedText type="body2" style={tw`text-green-700 font-bold`}>
            {formatCurrency(bill.total)}
          </ThemedText>
        </ThemedView>
      </ThemedView>
      <ThemedView style={tw`flex-row gap-2 `}>
        {/* Payment Method */}
        <ThemedView
          style={tw`flex-1 flex-row items-center gap-2  bg-transparent`}
        >
          <ThemedView
            style={tw`w-7 h-7 rounded-full ${paymentInfo.bgColor} items-center justify-center`}
          >
            <Ionicons
              name={paymentInfo.icon}
              size={16}
              color={paymentInfo.color}
            />
          </ThemedView>
          <ThemedText type="caption" style={tw`text-gray-700 font-medium`}>
            {paymentMethodLabel}
          </ThemedText>
        </ThemedView>

        {/* Time */}
        <ThemedView style={tw`flex-row items-center gap-1.5 bg-transparent`}>
          <Ionicons
            name="time-outline"
            size={14}
            color={tw.color("gray-500")}
          />
          <ThemedText type="caption" style={tw`text-gray-600`}>
            {time}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
