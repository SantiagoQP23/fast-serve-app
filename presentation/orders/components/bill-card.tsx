import React, { useState } from "react";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { View, Pressable, PressableProps } from "react-native";
import IconButton from "@/presentation/theme/components/icon-button";
import { Bill } from "@/core/orders/models/bill.model";
import dayjs from "dayjs";
import Label from "@/presentation/theme/components/label";
import Card from "@/presentation/theme/components/card";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";

interface BillCardProps extends PressableProps {
  bill: Bill;
}

export default function BillCard({ onPress, bill }: BillCardProps) {
  const { t } = useTranslation(["common", "bills"]);
  const date = dayjs(bill.createdAt).isSame(dayjs(), "day")
    ? `${t("common:time.today")}, ${dayjs(bill.createdAt).format("HH:mm")}`
    : dayjs(bill.createdAt).format("dddd, HH:mm");
  return (
    <Card onPress={onPress}>
      {/* <ThemedText>{JSON.stringify(bill)}</ThemedText> */}
      <ThemedView style={tw` bg-transparent gap-2`}>
        <ThemedView style={tw`flex-row bg-transparent justify-between gap-2`}>
          <ThemedText type="body1" style={tw`font-bold`}>
            {t("bills:list.billNumber", { number: bill.num })}
          </ThemedText>
          {bill.isPaid ? (
            <Label color="success" text={t("bills:details.paid")} />
          ) : (
            <Label color="warning" text={t("bills:details.unpaid")} />
          )}
        </ThemedView>
        <ThemedView
          style={tw` flex-row justify-between bg-transparent items-center `}
        >
          <ThemedText type="body2">{date}</ThemedText>
          <ThemedText type="h3">{formatCurrency(bill.total)}</ThemedText>
        </ThemedView>
      </ThemedView>
    </Card>
  );
}
