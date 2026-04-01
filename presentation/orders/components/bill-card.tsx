import React from "react";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { PressableProps } from "react-native";
import { Bill, BillStatus } from "@/core/orders/models/bill.model";
import dayjs from "dayjs";
import Label from "@/presentation/theme/components/label";
import Card from "@/presentation/theme/components/card";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  formatCurrency,
  getPaymentMethodIcon,
  translatePaymentMethod,
} from "@/core/i18n/utils";
import { useBillStatus } from "../hooks/useBillStatus";

/** Minimal shape required by BillCard — satisfied by both Bill and BillListItemDto */
interface BillCardItem {
  id: number;
  num: number;
  total: number;
  discount: number;
  status: BillStatus;
  createdAt: string | Date;
  owner: {
    person: {
      firstName: string;
      lastName: string;
    };
  };
}

interface BillCardProps extends PressableProps {
  bill: Bill;
}

export default function BillCard({ onPress, bill }: BillCardProps) {
  const { t } = useTranslation(["common", "bills"]);
  const date = dayjs(bill.createdAt).isSame(dayjs(), "day")
    ? `${t("common:time.today")}, ${dayjs(bill.createdAt).format("HH:mm")}`
    : dayjs(bill.createdAt).format("dddd, HH:mm");

  const { status } = useBillStatus(bill.status);

  return (
    <Card onPress={onPress}>
      <ThemedView style={tw`bg-transparent gap-3`}>
        {/* Header: Bill number and status */}

        <ThemedView
          style={tw`flex-row bg-transparent justify-between items-center`}
        >
          <Label
            color={status.color}
            size="small"
            text={status.text}
            leftIcon={status.icon}
          />
          {/* <Label color="default" text={bill.source} size="small" /> */}
        </ThemedView>
        <ThemedView
          style={tw`flex-row bg-transparent justify-between items-center`}
        >
          <ThemedView style={tw`flex-row bg-transparent items-center gap-2`}>
            <ThemedView style={tw`bg-light-surface p-2 rounded-md`}>
              <Ionicons
                name="receipt-outline"
                size={20}
                color={tw.color("black")}
              />
            </ThemedView>
            <ThemedView style={tw`bg-transparent gap-1`}>
              <ThemedText type="body1" style={tw`font-bold`}>
                {t(`bills:list.${bill.source}`, { number: bill.num })}
              </ThemedText>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {bill.owner.person.firstName} {bill.owner.person.lastName}
              </ThemedText>
            </ThemedView>
          </ThemedView>
          <ThemedView style={tw`bg-transparent gap-1 items-end`}>
            <ThemedText type="h3" style={tw`font-semibold `}>
              {formatCurrency(bill.total)}
            </ThemedText>
            <ThemedText type="small" style={tw`text-gray-500`}>
              {date}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </Card>
  );
}
