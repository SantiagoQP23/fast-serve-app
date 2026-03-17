import React, { useCallback, useState, useEffect } from "react";
import { ScrollView, RefreshControl, Alert, FlatList } from "react-native";
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
import DatePicker from "@/presentation/theme/components/date-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import { useTransactionsList } from "@/presentation/transactions/hooks/useTransactionsList";
import TransactionCard from "@/presentation/transactions/components/transaction-card";
import { formatCurrency } from "@/core/i18n/utils";
import { TransactionType } from "@/core/transactions/models/transaction-category.model";
import StatsCard from "@/presentation/home/components/stats-card";
import Button from "@/presentation/theme/components/button";

const STORAGE_KEY = "incomes_selected_date";

export default function IncomesScreen() {
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
      } catch {
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
    } catch {
      // Silently fail
    }
  }, []);

  // Convert date to ISO string format for API
  const dateFilter = dayjs(selectedDate).format("YYYY-MM-DD");

  // Fetch transactions for the selected date
  const {
    transactions,
    isLoading: transactionsLoading,
    isLoadingMore,
    refetch: refetchTransactions,
    loadMore,
    reset: resetTransactionsPagination,
    hasMore,
  } = useTransactionsList({ startDate: dateFilter, endDate: dateFilter });

  // Reset pagination when date changes
  useEffect(() => {
    resetTransactionsPagination();
  }, [dateFilter, resetTransactionsPagination]);

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.category.transactionType === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.category.transactionType === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await Promise.all([
        queryClient.refetchQueries({
          queryKey: [
            "dailyReport",
            currentRestaurant?.id,
            { startDate: dateFilter, endDate: dateFilter },
          ],
        }),
        queryClient.refetchQueries({
          queryKey: [
            "paymentMethodReport",
            currentRestaurant?.id,
            { startDate: dateFilter, endDate: dateFilter },
          ],
        }),
        refetchTransactions(),
      ]);
    } catch {
      Alert.alert(
        t("errors:order.fetchError"),
        t("errors:order.ordersFetchFailed"),
      );
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, currentRestaurant?.id, dateFilter, refetchTransactions, t]);

  return (
    <ThemedView style={tw`flex-1 pt-8 bg-light-background`}>
      <ThemedView style={tw`px-4 mb-4`}>
        <ThemedText type="h2">{t("common:navigation.incomes")}</ThemedText>
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
          <DailyReportSummaryCard startDate={dateFilter} endDate={dateFilter} />
          <PaymentMethodSummaryCard
            startDate={dateFilter}
            endDate={dateFilter}
          />

          {/* Transactions Section */}
          <ThemedView style={tw`mb-4`}>
            {/* Section Header */}
            <ThemedView style={tw`flex-row items-center justify-between mb-3`}>
              <ThemedText type="h4">
                {t("common:navigation.incomes")}
              </ThemedText>
            </ThemedView>

            {/* Summary Stats */}
            {transactions.length > 0 && (
              <ThemedView style={tw`flex-row gap-3 mb-3`}>
                <StatsCard
                  title={t("common:stats.totalIncome")}
                  value={formatCurrency(totalIncome)}
                  icon="trending-up-outline"
                />
                {totalExpense > 0 && (
                  <StatsCard
                    title={t("common:labels.total")}
                    value={formatCurrency(totalExpense)}
                    icon="trending-down-outline"
                  />
                )}
              </ThemedView>
            )}

            {/* Transactions List */}
            {transactionsLoading && !refreshing && transactions.length === 0 ? (
              <ThemedView style={tw`py-20 items-center`}>
                <ThemedText type="body2" style={tw`text-gray-400`}>
                  {t("common:status.loading")}
                </ThemedText>
              </ThemedView>
            ) : transactions.length > 0 ? (
              <>
                <ThemedView style={tw`bg-white rounded-2xl`}>
                  <FlatList
                    data={transactions}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <TransactionCard transaction={item} />
                    )}
                    scrollEnabled={false}
                    contentContainerStyle={tw`py-2 px-4`}
                  />
                </ThemedView>

                {/* Load More Button */}
                {hasMore && (
                  <ThemedView style={tw`mt-4`}>
                    <Button
                      label={
                        isLoadingMore
                          ? t("common:status.loading")
                          : t("common:actions.loadMore")
                      }
                      onPress={loadMore}
                      variant="outline"
                      disabled={isLoadingMore}
                      loading={isLoadingMore}
                    />
                  </ThemedView>
                )}
              </>
            ) : (
              <ThemedView style={tw`py-20 items-center px-4`}>
                <Ionicons
                  name="receipt-outline"
                  size={64}
                  color={tw.color("gray-300")}
                />
                <ThemedText
                  type="h4"
                  style={tw`text-gray-500 mt-4 text-center`}
                >
                  {t("common:empty.noData")}
                </ThemedText>
                <ThemedText
                  type="body2"
                  style={tw`text-gray-400 mt-2 text-center max-w-xs`}
                >
                  {t("common:empty.noResults")}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}
