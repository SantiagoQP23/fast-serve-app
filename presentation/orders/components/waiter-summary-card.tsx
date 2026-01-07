import React from "react";
import { Pressable } from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

interface WaiterSummaryCardProps {
  waiterId: string;
  waiterName: string;
  orderCount: number;
  isSelected?: boolean;
  onPress?: () => void;
}

export default function WaiterSummaryCard({
  waiterId,
  waiterName,
  orderCount,
  isSelected = false,
  onPress,
}: WaiterSummaryCardProps) {
  const { t } = useTranslation(["orders"]);

  return (
    <Pressable onPress={onPress}>
      <ThemedView
        style={tw`rounded-xl border ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"} p-4 min-w-60`}
      >
        <ThemedView style={tw`flex-row items-center gap-2 mb-2 bg-transparent`}>
          <ThemedView
            style={tw`w-10 h-10 rounded-full ${isSelected ? "bg-blue-500" : "bg-gray-200"} items-center justify-center`}
          >
            <Ionicons
              name="person"
              size={20}
              color={isSelected ? tw.color("white") : tw.color("gray-600")}
            />
          </ThemedView>
          <ThemedView style={tw`flex-1 bg-transparent`}>
            <ThemedText
              type="body2"
              style={tw`font-semibold ${isSelected ? "text-blue-700" : "text-gray-900"}`}
              numberOfLines={1}
            >
              {waiterName}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        <ThemedView style={tw`bg-transparent`}>
          <ThemedText type="caption" style={tw`text-gray-500`}>
            {t("orders:waiterSummary.orders")}
          </ThemedText>
          <ThemedText
            type="h4"
            style={tw`${isSelected ? "text-blue-700" : "text-gray-900"}`}
          >
            {orderCount}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}
