import React, { useCallback, useState, useEffect } from "react";
import { ScrollView, RefreshControl, Alert } from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import DailyReportSummaryCard from "@/presentation/home/components/daily-report-summary-card";
import PaymentMethodSummaryCard from "@/presentation/home/components/payment-method-summary-card";
import BillListCard from "@/presentation/home/components/bill-list-card";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import DatePicker from "@/presentation/theme/components/date-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";

const STORAGE_KEY = "dashboard_selected_date";

export default function DashboardScreen() {
  const { t } = useTranslation(["common", "errors"]);
  const { currentRestaurant } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const primaryColor = useThemeColor({}, "primary");
  const queryClient = useQueryClient();

  // Load persisted date on mount
  useEffect(() => {
    const loadPersistedDate = async () => {
      try {
        const savedDate = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedDate) {
          setSelectedDate(new Date(savedDate));
        }
      } catch (error) {
        // Silently fail, keep default date
      }
    };
    loadPersistedDate();
  }, []);

  // Persist date whenever it changes
  const handleDateChange = useCallback(async (date: Date) => {
    setSelectedDate(date);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, date.toISOString());
    } catch (error) {
      // Silently fail
    }
  }, []);

  // Convert date to ISO string format for API
  const dateFilter = dayjs(selectedDate).format("YYYY-MM-DD");

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      // Trigger haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Refetch daily report, payment method report, and bills list with current date filter
      await queryClient.refetchQueries({
        queryKey: ["dailyReport", currentRestaurant?.id, { date: dateFilter }],
      });
      await queryClient.refetchQueries({
        queryKey: ["paymentMethodReport", currentRestaurant?.id, { startDate: dateFilter, endDate: dateFilter }],
      });
      await queryClient.refetchQueries({
        queryKey: ["billsList", currentRestaurant?.id, { startDate: dateFilter, endDate: dateFilter }],
      });
    } catch {
      Alert.alert(
        t("errors:order.fetchError"),
        t("errors:order.ordersFetchFailed"),
      );
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, currentRestaurant?.id, dateFilter, t]);

  return (
    <ThemedView style={tw`flex-1 pt-8`}>
      <ThemedView style={tw`px-4 mb-4`}>
        <ThemedText type="h2">{t("common:navigation.dashboard")}</ThemedText>
      </ThemedView>

      {/* Date Picker */}
      <ThemedView style={tw`px-4 mb-4`}>
        <DatePicker
          value={selectedDate}
          onChange={handleDateChange}
          showTodayButton={true}
        />
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
          <DailyReportSummaryCard date={dateFilter} />
          <PaymentMethodSummaryCard startDate={dateFilter} endDate={dateFilter} />
          <BillListCard startDate={dateFilter} endDate={dateFilter} />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}
