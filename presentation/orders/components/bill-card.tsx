import React from "react";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { PressableProps } from "react-native";
import { Bill } from "@/core/orders/models/bill.model";
import { PaymentMethod } from "@/core/orders/enums/payment-method";
import dayjs from "dayjs";
import Label from "@/presentation/theme/components/label";
import Card from "@/presentation/theme/components/card";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";

interface BillCardProps extends PressableProps {
  bill: Bill;
}

const getPaymentMethodIcon = (method: PaymentMethod): keyof typeof Ionicons.glyphMap => {
  switch (method) {
    case PaymentMethod.CASH:
      return "cash-outline";
    case PaymentMethod.CREDIT_CARD:
      return "card-outline";
    case PaymentMethod.TRANSFER:
      return "swap-horizontal-outline";
    default:
      return "wallet-outline";
  }
};

const getPaymentMethodLabel = (method: PaymentMethod): string => {
  switch (method) {
    case PaymentMethod.CASH:
      return "Cash";
    case PaymentMethod.CREDIT_CARD:
      return "Card";
    case PaymentMethod.TRANSFER:
      return "Transfer";
    default:
      return method;
  }
};

export default function BillCard({ onPress, bill }: BillCardProps) {
  const { t } = useTranslation(["common", "bills"]);
  const date = dayjs(bill.createdAt).isSame(dayjs(), "day")
    ? `${t("common:time.today")}, ${dayjs(bill.createdAt).format("HH:mm")}`
    : dayjs(bill.createdAt).format("dddd, HH:mm");
  
  const hasDiscount = bill.discount > 0;
  const itemCount = bill.details?.length || 0;

  return (
    <Card onPress={onPress}>
      <ThemedView style={tw`bg-transparent gap-3`}>
        {/* Header: Bill number and status */}
        <ThemedView style={tw`flex-row bg-transparent justify-between items-center`}>
          <ThemedView style={tw`flex-row bg-transparent items-center gap-2`}>
            <ThemedView style={tw`bg-blue-500/10 p-2 rounded-full`}>
              <Ionicons 
                name="receipt-outline" 
                size={20} 
                color={tw.color("blue-600")} 
              />
            </ThemedView>
            <ThemedView style={tw`bg-transparent`}>
              <ThemedText type="body1" style={tw`font-bold`}>
                {t("bills:list.billNumber", { number: bill.num })}
              </ThemedText>
              <ThemedText type="caption" style={tw`text-gray-500`}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </ThemedText>
            </ThemedView>
          </ThemedView>
          {bill.isPaid ? (
            <Label 
              color="success" 
              text={t("bills:details.paid")} 
              leftIcon="checkmark-circle-outline"
            />
          ) : (
            <Label 
              color="warning" 
              text={t("bills:details.unpaid")} 
              leftIcon="time-outline"
            />
          )}
        </ThemedView>

        {/* Divider */}
        <ThemedView style={tw`h-px bg-gray-200`} />

        {/* Payment info and date */}
        <ThemedView style={tw`flex-row bg-transparent justify-between items-center`}>
          {bill.isPaid ? (
            <ThemedView style={tw`flex-row bg-transparent items-center gap-2`}>
              <Ionicons 
                name={getPaymentMethodIcon(bill.paymentMethod)} 
                size={18} 
                color={tw.color("gray-600")} 
              />
              <ThemedText type="body2" style={tw`text-gray-600`}>
                {getPaymentMethodLabel(bill.paymentMethod)}
              </ThemedText>
            </ThemedView>
          ) : (
            <ThemedView style={tw`bg-transparent`} />
          )}
          <ThemedView style={tw`flex-row bg-transparent items-center gap-1`}>
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={tw.color("gray-500")} 
            />
            <ThemedText type="caption" style={tw`text-gray-500`}>
              {date}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Total amount */}
        <ThemedView style={tw`flex-row bg-transparent justify-between items-center`}>
          <ThemedView style={tw`bg-transparent`}>
            <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
              Total Amount
            </ThemedText>
            <ThemedText type="h3" style={tw`font-bold text-gray-900`}>
              {formatCurrency(bill.total)}
            </ThemedText>
          </ThemedView>
          {hasDiscount && (
            <ThemedView style={tw`bg-green-500/10 px-3 py-1.5 rounded-lg`}>
              <ThemedText type="caption" style={tw`text-green-700 font-semibold`}>
                -{formatCurrency(bill.discount)} off
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        {/* Tap to view indicator */}
        <ThemedView style={tw`flex-row bg-transparent justify-center items-center gap-1 pt-1`}>
          <ThemedText type="caption" style={tw`text-gray-400`}>
            Tap to view details
          </ThemedText>
          <Ionicons 
            name="chevron-forward" 
            size={14} 
            color={tw.color("gray-400")} 
          />
        </ThemedView>
      </ThemedView>
    </Card>
  );
}
