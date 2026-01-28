import React from "react";
import { Pressable } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { BillListItemDto } from "@/core/orders/dto/bill-list-response.dto";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  formatCurrency,
  getPaymentMethodIcon,
  translatePaymentMethod,
  getRelativeTime,
} from "@/core/i18n/utils";

interface DashboardBillCardProps {
  bill: BillListItemDto;
  onPress?: () => void;
}

export default function DashboardBillCard({
  bill,
  onPress,
}: DashboardBillCardProps) {
  const { t } = useTranslation(["bills"]);

  // Get relative time
  const relativeTime = getRelativeTime(bill.createdAt);

  return (
    <Pressable onPress={onPress}>
      <ThemedView
        style={tw`flex-row items-center justify-between py-3 border-b border-gray-100`}
      >
        {/* Left: Icon + Bill info */}
        <ThemedView style={tw`flex-row items-center gap-3 flex-1`}>
          {/* Payment method icon */}
          <ThemedView
            style={tw`w-10 h-10 rounded-full ${
              bill.isPaid ? "bg-green-50" : "bg-orange-50"
            } items-center justify-center`}
          >
            <Ionicons
              name={
                bill.isPaid
                  ? getPaymentMethodIcon(bill.paymentMethod)
                  : "time-outline"
              }
              size={20}
              color={
                bill.isPaid ? tw.color("green-600") : tw.color("orange-600")
              }
            />
          </ThemedView>

          {/* Bill details */}
          <ThemedView style={tw`flex-1`}>
            <ThemedView style={tw`flex-row items-center gap-2`}>
              <ThemedText type="body1" style={tw`font-semibold`}>
                {t("bills:list.billNumber", { number: bill.num })}
              </ThemedText>
              {bill.discount > 0 && (
                <ThemedView style={tw`bg-blue-50 px-1.5 py-0.5 rounded`}>
                  <ThemedText type="caption" style={tw`text-blue-700 text-xs`}>
                    -{formatCurrency(bill.discount)}
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
            <ThemedView style={tw`flex-row items-center gap-1.5 mt-0.5`}>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {relativeTime}
              </ThemedText>
              {bill.isPaid && (
                <>
                  <ThemedText type="small" style={tw`text-gray-400`}>
                    •
                  </ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {translatePaymentMethod(bill.paymentMethod)}
                  </ThemedText>
                </>
              )}
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Right: Amount */}
        <ThemedView style={tw`items-end`}>
          <ThemedText
            type="body1"
            style={tw`font-semibold ${
              bill.isPaid ? "text-green-700" : "text-orange-700"
            }`}
          >
            {formatCurrency(bill.total)}
          </ThemedText>
          {!bill.isPaid && (
            <ThemedText type="caption" style={tw`text-orange-600`}>
              {t("bills:details.unpaid")}
            </ThemedText>
          )}
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}
