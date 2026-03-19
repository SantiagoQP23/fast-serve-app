import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  ScrollView,
  RefreshControl,
  Alert,
  FlatList,
  Pressable,
} from "react-native";
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
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import TransactionsFilterBottomSheet from "@/presentation/transactions/components/transactions-filter-bottom-sheet";
import Chip from "@/presentation/theme/components/chip";
import { usePaymentMethodsStore } from "@/presentation/restaurant/store/usePaymentMethodsStore";
import { FilterTransactionsDto } from "@/core/transactions/dto/filter-transactions.dto";
import IconButton from "@/presentation/theme/components/icon-button";

const STORAGE_KEY = "incomes_selected_date";
const FILTERS_STORAGE_KEY = "incomes_filters";

export default function IncomesScreen() {
  const { t } = useTranslation(["common", "errors"]);
  const { currentRestaurant } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filters, setFilters] = useState<FilterTransactionsDto>({});
  const primaryColor = useThemeColor({}, "primary");
  const queryClient = useQueryClient();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { paymentMethods } = usePaymentMethodsStore();

  // Animation config for bottom sheet
  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 50,
    stiffness: 300,
    mass: 1,
    overshootClamping: true,
  });

  // Load persisted date and filters on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const [savedDate, savedFilters] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(FILTERS_STORAGE_KEY),
        ]);
        if (savedDate) {
          setSelectedDate(new Date(savedDate));
        }
        if (savedFilters) {
          setFilters(JSON.parse(savedFilters));
        }
      } catch {
        // Silently fail, keep default values
      }
    };
    loadPersistedData();
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

  // Handle filter changes
  const handleFiltersChange = useCallback(
    async (newFilters: FilterTransactionsDto) => {
      setFilters(newFilters);
      try {
        await AsyncStorage.setItem(
          FILTERS_STORAGE_KEY,
          JSON.stringify(newFilters),
        );
      } catch {
        // Silently fail
      }
    },
    [],
  );

  // Helper functions for filter display
  const getPaymentMethodName = useCallback(
    (id: number) => {
      const pm = paymentMethods.find((p) => p.id === id);
      return pm?.name || "";
    },
    [paymentMethods],
  );

  const getAccountName = useCallback(
    (id: number) => {
      // Find account from payment method's allowed destination accounts
      for (const pm of paymentMethods) {
        const account = pm.allowedDestinationAccounts.find((a) => a.id === id);
        if (account) return account.name;
      }
      return "";
    },
    [paymentMethods],
  );

  const removeFilters = useCallback(async () => {
    const newFilters = {};
    setFilters(newFilters);
    try {
      await AsyncStorage.setItem(
        FILTERS_STORAGE_KEY,
        JSON.stringify(newFilters),
      );
    } catch {
      // Silently fail
    }
  }, []);

  // Convert date to ISO string format for API
  const dateFilter = dayjs(selectedDate).format("YYYY-MM-DD");

  // Fetch transactions for the selected date
  const {
    totalIncome,
    count,
    totalExpense,
    transactions,
    isLoading: transactionsLoading,
    isLoadingMore,
    refetch: refetchTransactions,
    loadMore,
    reset: resetTransactionsPagination,
    hasMore,
  } = useTransactionsList({
    startDate: dateFilter,
    endDate: dateFilter,
    ...filters,
  });

  const openFilterBottomSheet = () => {
    bottomSheetModalRef.current?.present();
  };

  // Reset pagination when date or filters change
  useEffect(() => {
    resetTransactionsPagination();
  }, [dateFilter, filters, resetTransactionsPagination]);

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

  const thereAreFiltersApplied =
    !!filters.paymentMethodId || !!filters.accountId;

  return (
    <ThemedView style={tw`flex-1 pt-8 bg-light-background`}>
      <ThemedView style={tw`px-4 mb-4`}>
        <ThemedText type="h2">{t("common:navigation.incomes")}</ThemedText>
      </ThemedView>

      {/* Date Picker */}
      <ThemedView style={tw`flex-row items-center gap-4 px-4 mb-4`}>
        <ThemedView style={tw` flex-1`}>
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            showTodayButton={true}
          />
        </ThemedView>
        <IconButton
          icon="filter"
          onPress={openFilterBottomSheet}
          style={tw``}
          variant={thereAreFiltersApplied ? "filled" : "text"}
        />
      </ThemedView>

      {/* Active Filter Chips */}
      {thereAreFiltersApplied && (
        <ThemedView style={tw`px-4 mb-4 flex-row flex-wrap gap-2`}>
          {filters.paymentMethodId && (
            <Chip
              label={getPaymentMethodName(filters.paymentMethodId)}
              selected
              onPress={() =>
                handleFiltersChange({
                  ...filters,
                  paymentMethodId: undefined,
                  accountId: undefined,
                })
              }
              icon="close"
            />
          )}
          {filters.accountId && (
            <Chip
              label={getAccountName(filters.accountId)}
              selected
              onPress={() =>
                handleFiltersChange({ ...filters, accountId: undefined })
              }
              icon="close"
            />
          )}
          <Chip label={t("common:actions.clearAll")} onPress={removeFilters} />
        </ThemedView>
      )}

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
        {count > 0 && (
          <ThemedView style={tw`px-4`}>
            {/* <DailyReportSummaryCard startDate={dateFilter} endDate={dateFilter} /> */}
            <ThemedView style={tw` p-4 mb-4 items-center`}>
              <ThemedText type="h1" style={tw`font-bold mb-1`}>
                {formatCurrency(totalIncome - totalExpense)}
              </ThemedText>
              <ThemedText type="small" style={tw`text-gray-400`}>
                {count} transactions
              </ThemedText>
            </ThemedView>
            <PaymentMethodSummaryCard
              startDate={dateFilter}
              endDate={dateFilter}
            />

            {/* Transactions Section */}
            <ThemedView style={tw`mb-4`}>
              {/* Section Header */}
              <ThemedView
                style={tw`flex-row items-center justify-between mb-3`}
              >
                <ThemedText type="h4">
                  {t("common:navigation.incomes")}
                </ThemedText>
              </ThemedView>

              {/* Transactions List */}
              {transactionsLoading &&
              !refreshing &&
              transactions.length === 0 ? (
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
        )}
      </ScrollView>

      {/* Filter Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={["75%"]}
        enablePanDownToClose
        animationConfigs={animationConfigs}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
          />
        )}
      >
        <TransactionsFilterBottomSheet
          initialFilters={filters}
          onApply={(newFilters: FilterTransactionsDto) => {
            handleFiltersChange(newFilters);
            bottomSheetModalRef.current?.dismiss();
          }}
          onClose={() => bottomSheetModalRef.current?.dismiss()}
        />
      </BottomSheetModal>
    </ThemedView>
  );
}
