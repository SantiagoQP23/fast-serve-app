import React, { useCallback, useState } from "react";
import { ScrollView, RefreshControl, Alert } from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import DailyReportSummaryCard from "@/presentation/home/components/daily-report-summary-card";
import PaymentMethodSummaryCard from "@/presentation/home/components/payment-method-summary-card";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

export default function DashboardScreen() {
  const { t } = useTranslation(["common", "errors"]);
  const { currentRestaurant } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const primaryColor = useThemeColor({}, "primary");
  const queryClient = useQueryClient();

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      // Trigger haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Refetch daily report and payment method report
      await queryClient.refetchQueries({
        queryKey: ["dailyReport", currentRestaurant?.id],
      });
      await queryClient.refetchQueries({
        queryKey: ["paymentMethodReport", currentRestaurant?.id],
      });
    } catch {
      Alert.alert(
        t("errors:order.fetchError"),
        t("errors:order.ordersFetchFailed"),
      );
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, currentRestaurant?.id, t]);

  return (
    <ThemedView style={tw`flex-1 pt-8`}>
      <ThemedView style={tw`px-4 mb-4`}>
        <ThemedText type="h2">{t("common:navigation.dashboard")}</ThemedText>
      </ThemedView>

      <ScrollView
        contentContainerStyle={tw`pb-20`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
      >
        <ThemedView style={tw`px-4`}>
          <DailyReportSummaryCard />
          <PaymentMethodSummaryCard />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}
