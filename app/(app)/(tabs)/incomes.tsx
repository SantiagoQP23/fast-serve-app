import {
  useCallback,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { ScrollView, RefreshControl, Alert, Pressable } from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useRouter } from "expo-router";
import PaymentMethodSummaryCard from "@/presentation/home/components/payment-method-summary-card";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { useUsers } from "@/presentation/users/hooks/useUsers";
import DatePicker from "@/presentation/theme/components/date-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import Icon from "@/presentation/theme/components/icon";
import { useTransactionsList } from "@/presentation/transactions/hooks/useTransactionsList";
import TransactionCard from "@/presentation/transactions/components/transaction-card";
import { formatCurrency } from "@/core/i18n/utils";
import Button from "@/presentation/theme/components/button";

import TransactionsFilterBottomSheet from "@/presentation/transactions/components/transactions-filter-bottom-sheet";
import Chip from "@/presentation/theme/components/chip";
import { usePaymentMethodsStore } from "@/presentation/restaurant/store/usePaymentMethodsStore";
import { FilterTransactionsDto } from "@/core/transactions/dto/filter-transactions.dto";
import IconButton from "@/presentation/theme/components/icon-button";
import { useTransactionPaymentMethodReport } from "@/presentation/transactions/hooks/useTransactionPaymentMethodReport";
import { usePaymentProofsRealtime } from "@/presentation/transactions/hooks/usePaymentProofsRealtime";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { Transaction } from "@/core/transactions/models/transaction.model";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { GroupedList } from "@/presentation/theme/components/grouped-list";
import Card from "@/presentation/theme/components/card";
import TransactionDetailView from "@/presentation/transactions/components/transaction-detail-view";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";
import { useDashboardStats } from "@/presentation/orders/hooks/useDashboardStats";
import { useDailyReport } from "@/presentation/orders/hooks/useDailyReport";
import {
  DateRangeFilter,
  getDateRangeFor,
} from "@/core/orders/enums/date-range-filter.enum";
import AmountSummaryHeader from "@/presentation/reports/components/amount-summary-header";
import WaiterSummaryCard from "@/presentation/reports/components/waiter-summary-card";

const STORAGE_KEY = "incomes_selected_date";
const FILTERS_STORAGE_KEY = "incomes_filters";
const LIST_PANE_WIDTH = 440;

export default function IncomesScreen() {
  const { t } = useTranslation(["common", "errors", "reports"]);
  const router = useRouter();
  const { currentRestaurant } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filters, setFilters] = useState<FilterTransactionsDto>({});
  const primaryColor = useThemeColor({}, "primary");
  const queryClient = useQueryClient();
  const bottomSheetModalRef = useRef<BottomSheetMethods>(null);
  const { paymentMethods } = usePaymentMethodsStore();

  // Tablet landscape: transactions open in a pane next to the list
  const { isExpanded } = useResponsiveLayout();
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    number | null
  >(null);

  const { user } = useAuthStore();
  const { users } = useUsers();
  const isAdmin = isAdminLevelRole(user?.role?.name);
  const availableWaiters = useMemo(() => {
    const filteredUsers = isAdmin
      ? users.filter((u) => u.isActive)
      : users.filter((u) => u.isActive && u.id === user?.id);

    return filteredUsers
      .map((u) => ({
        id: u.id,
        fullName: `${u.person.firstName} ${u.person.lastName}`,
      }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [users, user, isAdmin]);

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

  // Billed vs. collected totals and per-waiter breakdown for the selected day
  const statsRange = useMemo(
    () =>
      getDateRangeFor(DateRangeFilter.CUSTOM, {
        startDate: selectedDate,
        endDate: selectedDate,
      }),
    [selectedDate],
  );
  const { dashboardStats, refetch: refetchStats } =
    useDashboardStats(statsRange);
  const { dailyReport } = useDailyReport({
    startDate: dateFilter,
    endDate: dateFilter,
  });
  const reportWaiters = dailyReport?.waiterStats ?? [];

  const { paymentMethodReport } = useTransactionPaymentMethodReport({
    startDate: dateFilter,
    endDate: dateFilter,
  });

  // Aggregate all accounts across payment methods
  const accountsSummary = useMemo(() => {
    if (!paymentMethodReport?.report) return [];

    const accountMap = new Map<
      number,
      { accountId: number; accountName: string; totalIncome: number }
    >();

    paymentMethodReport.report.forEach((pm) => {
      pm.incomeByAccount.forEach((account) => {
        if (accountMap.has(account.accountId)) {
          const existing = accountMap.get(account.accountId)!;
          existing.totalIncome += account.totalIncome;
        } else {
          accountMap.set(account.accountId, { ...account });
        }
      });
    });

    return Array.from(accountMap.values()).sort(
      (a, b) => b.totalIncome - a.totalIncome,
    );
  }, [paymentMethodReport]);

  // Fetch transactions for the selected date
  const {
    count,
    transactions,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
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

  const openAllTransactions = () => {
    router.push({
      pathname: "/transaction",
      params: {
        startDate: dateFilter,
        endDate: dateFilter,
        ...(filters.paymentMethodId
          ? { paymentMethodId: String(filters.paymentMethodId) }
          : {}),
        ...(filters.accountId ? { accountId: String(filters.accountId) } : {}),
        ...(filters.createdById ? { createdById: filters.createdById } : {}),
      },
    });
  };

  // Account screen: that account's transactions for the day + its total
  const openAccount = (accountId: number) => {
    router.push({
      pathname: "/transaction",
      params: {
        startDate: dateFilter,
        endDate: dateFilter,
        accountId: String(accountId),
      },
    });
  };

  const openTransactionDetail = (transaction: Transaction) => {
    if (isExpanded) {
      setSelectedTransactionId(transaction.id);
      return;
    }
    router.push(`/transaction/${transaction.id}`);
  };

  // Reset pagination when date or filters change
  useEffect(() => {
    resetTransactionsPagination();
  }, [dateFilter, filters, resetTransactionsPagination]);

  const onRefresh = async () => {
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
            "transactionPaymentMethodReport",
            currentRestaurant?.id,
            { startDate: dateFilter, endDate: dateFilter },
          ],
        }),
        refetchTransactions(),
        refetchStats(),
      ]);
    } catch {
      Alert.alert(
        t("errors:order.fetchError"),
        t("errors:order.ordersFetchFailed"),
      );
    } finally {
      setRefreshing(false);
    }
  };

  usePaymentProofsRealtime();

  const thereAreFiltersApplied =
    !!filters.paymentMethodId || !!filters.accountId || !!filters.createdById;

  const content = (
    <>
      <ThemedView style={tw`px-4 mb-6`}>
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
          icon="funnel"
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
              icon="x"
            />
          )}
          {filters.accountId && (
            <Chip
              label={getAccountName(filters.accountId)}
              selected
              onPress={() =>
                handleFiltersChange({ ...filters, accountId: undefined })
              }
              icon="x"
            />
          )}
          {filters.createdById && (
            <Chip
              label={
                availableWaiters.find((w) => w.id === filters.createdById)
                  ?.fullName ?? t("common:filters.user")
              }
              selected
              onPress={() =>
                handleFiltersChange({ ...filters, createdById: undefined })
              }
              icon="x"
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
        {/* Amount Summary */}
        <ThemedView style={tw`px-4 mt-2 mb-6 gap-1`}>
          <AmountSummaryHeader
            totalAmount={dashboardStats?.totalAmount ?? 0}
            totalIncome={dashboardStats?.totalIncome ?? 0}
          />
          {count > 0 && (
            <ThemedText type="small" style={tw`text-gray-400`}>
              {count} transactions
            </ThemedText>
          )}
        </ThemedView>

        {count > 0 && (
          <ThemedView style={tw`px-4`}>
            <PaymentMethodSummaryCard
              startDate={dateFilter}
              endDate={dateFilter}
            />

            {/* Accounts Summary Section */}
            {accountsSummary.length > 0 && (
              <ThemedView style={tw`mb-4 mt-8`}>
                <ThemedView
                  style={tw`flex-row items-center justify-between mb-3`}
                >
                  <ThemedText type="h4">
                    {t("reports:accounts.title")}
                  </ThemedText>
                  <Pressable
                    onPress={() => setShowAccounts((prev) => !prev)}
                    hitSlop={8}
                  >
                    <Icon
                      name={showAccounts ? "eye-off" : "eye"}
                      size={18}
                      color={tw.color("gray-500")}
                    />
                  </Pressable>
                </ThemedView>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={tw`gap-4`}
                >
                  {accountsSummary.map((account) => {
                    const formattedAccountIncome = formatCurrency(
                      account.totalIncome,
                    );
                    const displayedAccountIncome = showAccounts
                      ? formattedAccountIncome
                      : formattedAccountIncome.replace(/\d/g, "*");
                    const isSelected = filters.accountId === account.accountId;

                    return (
                      <Card
                        key={account.accountId}
                        variant="outline"
                        style={[
                          tw`w-36`,
                          isSelected && {
                            borderColor: primaryColor,
                            borderWidth: 2,
                          },
                        ]}
                        onPress={() => openAccount(account.accountId)}
                      >
                        <ThemedText
                          type="small"
                          style={tw`text-gray-500 mb-3`}
                          numberOfLines={1}
                        >
                          {account.accountName}
                        </ThemedText>
                        <ThemedText
                          type="h3"
                          style={[
                            tw`font-semibold`,
                            isSelected && { color: primaryColor },
                          ]}
                        >
                          {displayedAccountIncome}
                        </ThemedText>
                      </Card>
                    );
                  })}
                </ScrollView>
              </ThemedView>
            )}

            {/* Waiter Summary */}
            {reportWaiters.length > 0 && (
              <ThemedView style={tw`mt-4 mb-4`}>
                <WaiterSummaryCard waiters={reportWaiters} />
              </ThemedView>
            )}

            {/* Transactions Section */}
            <Card containerStyle={tw`mb-4 mt-4`}>
              <ThemedText type="h4" style={tw`mb-3`}>
                {t("common:navigation.incomes")}
              </ThemedText>

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
                  <GroupedList
                    data={transactions}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={(item) => (
                      <TransactionCard
                        transaction={item}
                        active={isExpanded && item.id === selectedTransactionId}
                        onPress={() => openTransactionDetail(item)}
                      />
                    )}
                  />

                  {/* Only the first page lives here; the rest is one tap away */}
                  {hasMore && (
                    <ThemedView style={tw`mt-4`}>
                      <Button
                        label={t("common:transactions.seeAll", { count })}
                        onPress={openAllTransactions}
                        variant="outline"
                        size="small"
                      />
                    </ThemedView>
                  )}
                </>
              ) : (
                <ThemedView style={tw`py-20 items-center px-4`}>
                  <Icon
                    name="receipt-text"
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
            </Card>
          </ThemedView>
        )}

        {/* Waiter Summary (no transactions yet, but orders may exist) */}
        {count === 0 && reportWaiters.length > 0 && (
          <ThemedView style={tw`px-4`}>
            <WaiterSummaryCard waiters={reportWaiters} />
          </ThemedView>
        )}

        {/* Empty state: no incomes for the selected date / filters */}
        {!transactionsLoading && count === 0 && (
          <ThemedView style={tw`py-20 items-center px-4`}>
            <Icon name="receipt-text" size={64} color={tw.color("gray-300")} />
            <ThemedText type="h4" style={tw`text-gray-500 mt-4 text-center`}>
              {t("common:empty.noIncomes")}
            </ThemedText>
            <ThemedText
              type="body2"
              style={tw`text-gray-400 mt-2 text-center max-w-xs`}
            >
              {thereAreFiltersApplied
                ? t("common:empty.noIncomesFiltered")
                : t("common:empty.noIncomesDescription")}
            </ThemedText>
          </ThemedView>
        )}
        {/* Order History */}
        <ThemedView style={tw`px-4 mt-4`}>
          <Card onPress={() => router.push("/(profile)/history")}>
            <ThemedView style={tw`flex-row items-center gap-3`}>
              <Icon name="clock" size={22} color={tw.color("gray-500")} />
              <ThemedView style={tw`flex-1`}>
                <ThemedText type="body1">
                  {t("common:stats.orderHistory")}
                </ThemedText>
              </ThemedView>
              <Icon
                name="chevron-right"
                size={20}
                color={tw.color("gray-400")}
              />
            </ThemedView>
          </Card>
        </ThemedView>
      </ScrollView>

      {/* Filter Bottom Sheet */}
      <ThemedBottomSheetModal ref={bottomSheetModalRef} enablePanDownToClose>
        <TransactionsFilterBottomSheet
          initialFilters={filters}
          onApply={(newFilters: FilterTransactionsDto) => {
            handleFiltersChange(newFilters);
            bottomSheetModalRef.current?.dismiss();
          }}
          onClose={() => bottomSheetModalRef.current?.dismiss()}
          availableUsers={availableWaiters}
          isAdmin={isAdmin}
        />
      </ThemedBottomSheetModal>
    </>
  );

  if (!isExpanded) {
    return <ScreenLayout style={tw`flex-1 pt-8`}>{content}</ScreenLayout>;
  }

  return (
    <ScreenLayout fullWidth style={tw`flex-1 flex-row`}>
      <ThemedView style={[tw`pt-8`, { width: LIST_PANE_WIDTH }]}>
        {content}
      </ThemedView>
      <ThemedView style={tw`flex-1 border-l border-outline-variant`}>
        {selectedTransactionId != null ? (
          <TransactionDetailView
            key={selectedTransactionId}
            transactionId={selectedTransactionId}
            embedded
            onClose={() => setSelectedTransactionId(null)}
          />
        ) : (
          <ThemedView style={tw`flex-1 items-center justify-center gap-4 px-8`}>
            <Icon name="arrow-up-down" size={64} color={tw.color("gray-400")} />
            <ThemedText type="h3">
              {t("common:transactions.pane.emptyTitle")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center max-w-xs`}>
              {t("common:transactions.pane.emptyDescription")}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ScreenLayout>
  );
}
