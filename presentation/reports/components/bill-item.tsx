import React from "react";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency, getPaymentMethodInfo } from "@/core/i18n/utils";
import { WaiterBillDto } from "@/core/orders/dto/daily-report-response.dto";
import dayjs from "dayjs";

interface BillItemProps {
  bill: WaiterBillDto;
}

export default function BillItem({ bill }: BillItemProps) {
  const { t } = useTranslation(["reports", "bills"]);

  const paymentInfo = getPaymentMethodInfo(bill.paymentMethod);
  const paymentMethodLabel = t(paymentInfo.translationKey);
  const time = dayjs(bill.createdAt).format("HH:mm");

  return (
    <ThemedView style={tw`  pb-3  bg-white  rounded-xl `}>
      <ThemedView style={tw`flex-row justify-between mb-2`}>
        {/* Bill Number */}
        <ThemedView
          style={tw`flex-row items-center gap-2 bg-transparent min-w-16`}
        >
          <ThemedText type="body2" style={tw`text-gray-900 font-bold`}>
            Cuenta #{bill.num}
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
        {bill.isPaid && (
          <ThemedView style={tw` flex-row items-center gap-1  bg-transparent`}>
            <ThemedView
              style={tw`w-7 h-7 rounded-full  items-center justify-center`}
            >
              <Ionicons
                name={paymentInfo.icon}
                size={16}
                color={paymentInfo.color}
              />
            </ThemedView>
            <ThemedText type="small" style={tw`text-gray-700 font-medium`}>
              {paymentMethodLabel}
            </ThemedText>
          </ThemedView>
        )}

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
