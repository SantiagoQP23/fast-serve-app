import React, { useState } from "react";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { View, Pressable, PressableProps } from "react-native";
import IconButton from "@/presentation/theme/components/icon-button";
import { Bill } from "@/core/orders/models/bill.model";
import dayjs from "dayjs";

interface BillCardProps extends PressableProps {
  bill: Bill;
}

export default function BillCard({ onPress, bill }: BillCardProps) {
  const date = dayjs(bill.createdAt).isSame(dayjs(), "day")
    ? `Today, ${dayjs(bill.createdAt).format("HH:mm")}`
    : dayjs(bill.createdAt).format("dddd, HH:mm");
  return (
    <Pressable
      style={({ pressed }) => [
        tw`mb-3 p-4 rounded-2xl bg-gray-100 dark:bg-gray-800`,
        pressed && tw`opacity-80`,
      ]}
      onPress={onPress}
    >
      {/* <ThemedText>{JSON.stringify(bill)}</ThemedText> */}
      <ThemedView style={tw` bg-transparent gap-2`}>
        <ThemedView style={tw`flex-row bg-transparent justify-between gap-2`}>
          <ThemedText type="body1" style={tw`font-bold`}>
            Bill #{bill.num}
          </ThemedText>
          {bill.isPaid ? (
            <ThemedView
              style={tw` flex-row justify-between bg-transparent items-center `}
            >
              <ThemedText type="body2">Paid</ThemedText>
            </ThemedView>
          ) : (
            <ThemedView
              style={tw` flex-row justify-between bg-transparent items-center `}
            >
              <ThemedText type="body2">Not paid</ThemedText>
            </ThemedView>
          )}
        </ThemedView>
        <ThemedView
          style={tw` flex-row justify-between bg-transparent items-center `}
        >
          <ThemedText type="body2">{date}</ThemedText>
          <ThemedText type="h3">${bill.total}</ThemedText>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}
