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

const getPaymentMethodIcon = (
  method: PaymentMethod,
): keyof typeof Ionicons.glyphMap => {
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
        <ThemedView
          style={tw`flex-row bg-transparent justify-between items-center`}
        >
          <ThemedView style={tw`flex-row bg-transparent items-center gap-2`}>
            <ThemedView style={tw`bg-light-surface p-2 rounded-full`}>
              <Ionicons
                name="receipt-outline"
                size={20}
                color={tw.color("light-primary")}
              />
            </ThemedView>
            <ThemedView style={tw`bg-transparent`}>
              <ThemedText type="body1" style={tw`font-bold`}>
                {t("bills:list.billNumber", { number: bill.num })}
              </ThemedText>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {date}
              </ThemedText>
            </ThemedView>
          </ThemedView>
          <ThemedText type="h3" style={tw`font-semibold `}>
            {formatCurrency(bill.total)}
          </ThemedText>
          {/* {bill.isPaid ? ( */}
          {/*   <Label */}
          {/*     color="success" */}
          {/*     text={t("bills:details.paid")} */}
          {/*     leftIcon="checkmark-circle-outline" */}
          {/*   /> */}
          {/* ) : ( */}
          {/*   <Label */}
          {/*     color="warning" */}
          {/*     text={t("bills:details.unpaid")} */}
          {/*     leftIcon="time-outline" */}
          {/*   /> */}
          {/* )} */}
        </ThemedView>

        {/* Divider */}
        <ThemedView style={tw`h-px bg-gray-200`} />

        {/* Payment info and date */}
        <ThemedView
          style={tw`flex-row bg-transparent justify-between items-center`}
        >
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
        </ThemedView>
      </ThemedView>
    </Card>
  );
}
