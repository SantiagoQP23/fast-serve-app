import React from "react";
import { Pressable } from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useBillsList } from "@/presentation/orders/hooks/useBillsList";
import { useRouter } from "expo-router";
import DashboardBillCard from "./dashboard-bill-card";
import Button from "@/presentation/theme/components/button";

export default function BillListCard({ 
  startDate, 
  endDate 
}: { 
  startDate?: string; 
  endDate?: string;
}) {
  const { t } = useTranslation(["bills", "common"]);
  const { bills, count, isLoading } = useBillsList({ 
    limit: 10,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });
  const router = useRouter();

  const handleBillPress = (billItem: any) => {
    // Navigate to view-only screen using order ID
    router.push(`/(order-view)/${billItem.order.id}`);
  };

  const handleSeeAll = () => {
    router.push("/(reports)/bills-list");
  };

  return (
    <ThemedView style={tw` py-4  mb-4`}>
      <ThemedView style={tw`flex-row items-center justify-between mb-3`}>
        <ThemedText type="h4">{t("bills:list.todaysBills")}</ThemedText>
        <ThemedView style={tw`flex-row items-center gap-2`}>
          {count > 0 && (
            <ThemedView style={tw`bg-primary-50 px-2 py-0.5 rounded-full`}>
              <ThemedText
                type="caption"
                style={tw`text-primary-700 font-semibold`}
              >
                {count}
              </ThemedText>
            </ThemedView>
          )}
          <Pressable onPress={handleSeeAll} style={tw`p-1`}>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={tw.color("gray-500")}
            />
          </Pressable>
        </ThemedView>
      </ThemedView>

      {isLoading ? (
        <ThemedView style={tw`py-8`}>
          <ThemedText type="body2" style={tw`text-gray-400 text-center`}>
            {t("common:status.loading")}
          </ThemedText>
        </ThemedView>
      ) : bills.length > 0 ? (
        <ThemedView>
          {/* Bill list */}
          <ThemedView style={tw``}>
            {bills.map((bill) => (
              <DashboardBillCard
                key={bill.id}
                bill={bill}
                onPress={() => handleBillPress(bill)}
              />
            ))}
          </ThemedView>

          {/* See All button */}
          {count > 10 && (
            <ThemedView style={tw`mt-4`}>
              <Button
                label={t("bills:list.seeAllBills", { count })}
                variant="outline"
                onPress={handleSeeAll}
                size="small"
              />
            </ThemedView>
          )}
        </ThemedView>
      ) : (
        <ThemedView style={tw`py-8 items-center`}>
          <Ionicons
            name="receipt-outline"
            size={48}
            color={tw.color("gray-300")}
          />
          <ThemedText type="body1" style={tw`text-gray-500 mt-3 text-center`}>
            {t("bills:list.noBillsToday")}
          </ThemedText>
          <ThemedText type="small" style={tw`text-gray-400 mt-1 text-center`}>
            {t("bills:list.noBillsTodayDescription")}
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}
