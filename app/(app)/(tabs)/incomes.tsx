import { useCallback, useState, useEffect, useRef, useMemo } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import Icon from "@/presentation/theme/components/icon";
import { useTransactionsList } from "@/presentation/transactions/hooks/useTransactionsList";
import TransactionCard from "@/presentation/transactions/components/transaction-card";
import { formatCurrency, formatDate } from "@/core/i18n/utils";
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
import Label from "@/presentation/theme/components/label";
import CustomDateRangeBottomSheet from "@/presentation/orders/components/custom-date-range-bottom-sheet";
import type { AccountReportItem } from "@/core/transactions/dto/payment-method-report-response.dto";

const DATE_RANGE_STORAGE_KEY = "incomes_date_range";
const FILTERS_STORAGE_KEY = "incomes_filters";
const LIST_PANE_WIDTH = 440;

export default function IncomesScreen() {
  const { t } = useTranslation(["common", "errors", "reports"]);
  const router = useRouter();
  const { currentRestaurant } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [selectedDateRangeFilter, setSelectedDateRangeFilter] =
    useState<DateRangeFilter>(DateRangeFilter.TODAY);
  const [customRange, setCustomRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>();
  const customRangeSheetRef = useRef<BottomSheetMethods>(null);
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

  // Load persisted date range and filters on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const [savedDateRange, savedFilters] = await Promise.all([
          AsyncStorage.getItem(DATE_RANGE_STORAGE_KEY),
          AsyncStorage.getItem(FILTERS_STORAGE_KEY),
        ]);
        if (savedDateRange) {
          const { filter, startDate, endDate } = JSON.parse(savedDateRange);
          if (filter === DateRangeFilter.CUSTOM) {
            if (startDate && endDate) {
              setCustomRange({
                startDate: new Date(startDate),
                endDate: new Date(endDate),
              });
              setSelectedDateRangeFilter(filter);
            }
          } else if (Object.values(DateRangeFilter).includes(filter)) {
            setSelectedDateRangeFilter(filter);
          }
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

  const dateRangeChips = [
    { filter: DateRangeFilter.TODAY, label: t("common:stats.dateRange.today") },
    {
      filter: DateRangeFilter.WEEK_TO_DATE,
      label: t("common:stats.dateRange.weekToDate"),
    },
    {
      filter: DateRangeFilter.MONTH_TO_DATE,
      label: t("common:stats.dateRange.monthToDate"),
    },
    {
      filter: DateRangeFilter.YEAR_TO_DATE,
      label: t("common:stats.dateRange.yearToDate"),
    },
    {
      filter: DateRangeFilter.CUSTOM,
      // Once applied, the custom chip shows the picked day(s)
      label:
        selectedDateRangeFilter === DateRangeFilter.CUSTOM && customRange
          ? dayjs(customRange.startDate).isSame(customRange.endDate, "day")
            ? formatDate(customRange.startDate)
            : `${formatDate(customRange.startDate)} – ${formatDate(customRange.endDate)}`
          : t("common:stats.dateRange.custom"),
    },
  ];

  // Persist the date range whenever it changes
  const persistDateRange = useCallback(
    async (
      filter: DateRangeFilter,
      range?: { startDate: Date; endDate: Date },
    ) => {
      try {
        await AsyncStorage.setItem(
          DATE_RANGE_STORAGE_KEY,
          JSON.stringify({
            filter,
            startDate: range?.startDate.toISOString(),
            endDate: range?.endDate.toISOString(),
          }),
        );
      } catch {
        // Silently fail
      }
    },
    [],
  );

  const handleSelectDateRangeFilter = (filter: DateRangeFilter) => {
    if (filter === DateRangeFilter.CUSTOM) {
      customRangeSheetRef.current?.present();
      return;
    }
    setSelectedDateRangeFilter(filter);
    persistDateRange(filter);
  };

  const handleApplyCustomRange = (range: {
    startDate: Date;
    endDate: Date;
  }) => {
    setCustomRange(range);
    setSelectedDateRangeFilter(DateRangeFilter.CUSTOM);
    persistDateRange(DateRangeFilter.CUSTOM, range);
  };

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

  const dateRange = useMemo(
    () => getDateRangeFor(selectedDateRangeFilter, customRange),
    [selectedDateRangeFilter, customRange],
  );
  // Day-only strings for the report and transaction APIs
  const startDate = dayjs(dateRange.startDate).format("YYYY-MM-DD");
  const endDate = dayjs(dateRange.endDate).format("YYYY-MM-DD");

  // Billed vs. collected totals and per-waiter breakdown for the selected range
  const { dashboardStats, refetch: refetchStats } =
    useDashboardStats(dateRange);
  const { dailyReport } = useDailyReport({ startDate, endDate });
  // Per-waiter breakdown is a restaurant-wide view; others only see themselves
  const reportWaiters = isAdmin ? (dailyReport?.waiterStats ?? []) : [];

  const { paymentMethodReport } = useTransactionPaymentMethodReport({
    startDate,
    endDate,
  });

  // Every account, even without income in the range, with its pending count.
  // Older backends only send per-method income, so aggregate that instead.
  const accountsSummary = useMemo<AccountReportItem[]>(() => {
    if (paymentMethodReport?.accounts) return paymentMethodReport.accounts;
    if (!paymentMethodReport?.report) return [];

    const accountMap = new Map<number, AccountReportItem>();

    paymentMethodReport.report.forEach((pm) => {
      pm.incomeByAccount.forEach((account) => {
        if (accountMap.has(account.accountId)) {
          const existing = accountMap.get(account.accountId)!;
          existing.totalIncome += account.totalIncome;
        } else {
          accountMap.set(account.accountId, { ...account, pendingCount: 0 });
        }
      });
    });

    return Array.from(accountMap.values()).sort(
      (a, b) => b.totalIncome - a.totalIncome,
    );
  }, [paymentMethodReport]);

  const accountRows = useMemo(() => {
    const rows: AccountReportItem[][] = [];
    for (let i = 0; i < accountsSummary.length; i += 2) {
      rows.push(accountsSummary.slice(i, i + 2));
    }
    return rows;
  }, [accountsSummary]);

  // Fetch transactions for the selected range
  const {
    count,
    transactions,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
    reset: resetTransactionsPagination,
    hasMore,
  } = useTransactionsList({
    startDate,
    endDate,
    ...filters,
  });

  const openFilterBottomSheet = () => {
    bottomSheetModalRef.current?.present();
  };

  const openAllTransactions = () => {
    router.push({
      pathname: "/transaction",
      params: {
        startDate,
        endDate,
        ...(filters.paymentMethodId
          ? { paymentMethodId: String(filters.paymentMethodId) }
          : {}),
        ...(filters.accountId ? { accountId: String(filters.accountId) } : {}),
        ...(filters.createdById ? { createdById: filters.createdById } : {}),
      },
    });
  };

  // Account screen: that account's transactions for the range + its total
  const openAccount = (accountId: number) => {
    router.push({
      pathname: "/transaction",
      params: {
        startDate,
        endDate,
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

  // Reset pagination when the date range or filters change
  useEffect(() => {
    resetTransactionsPagination();
  }, [startDate, endDate, filters, resetTransactionsPagination]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await Promise.all([
        queryClient.refetchQueries({
          queryKey: [
            "dailyReport",
            currentRestaurant?.id,
            { startDate, endDate },
          ],
        }),
        queryClient.refetchQueries({
          queryKey: [
            "transactionPaymentMethodReport",
            currentRestaurant?.id,
            { startDate, endDate },
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

      {/* Date Range Chips */}
      <ThemedView style={tw`flex-row items-center gap-2 pl-4 pr-2 mb-4`}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={tw`flex-1`}
          contentContainerStyle={tw`gap-2`}
        >
          {dateRangeChips.map(({ filter, label }) => (
            <Chip
              key={filter}
              label={label}
              selected={selectedDateRangeFilter === filter}
              onPress={() => handleSelectDateRangeFilter(filter)}
            />
          ))}
        </ScrollView>
        <IconButton
          icon="funnel"
          onPress={openFilterBottomSheet}
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
          {/* {count > 0 && ( */}
          {/*   <ThemedText type="small" style={tw`text-gray-400`}> */}
          {/*     {count} transactions */}
          {/*   </ThemedText> */}
          {/* )} */}
        </ThemedView>

        {/* Accounts Summary: every account, even with no income yet */}
        {accountsSummary.length > 0 && (
          <ThemedView style={tw`px-4`}>
            <ThemedView style={tw`mb-4 ${count > 0 ? "mt-8" : ""}`}>
              <ThemedView
                style={tw`flex-row items-center justify-between mb-3`}
              >
                <ThemedText type="h4">{t("reports:accounts.title")}</ThemedText>
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
              {/* Two-column grid; an odd last card keeps its column width */}
              <ThemedView style={tw`gap-3`}>
                {accountRows.map((row) => (
                  <ThemedView
                    key={row.map((a) => a.accountId).join("-")}
                    style={tw`flex-row gap-3`}
                  >
                    {row.map((account) => {
                      const formattedAccountIncome = formatCurrency(
                        account.totalIncome,
                      );
                      const displayedAccountIncome = showAccounts
                        ? formattedAccountIncome
                        : formattedAccountIncome.replace(/\d/g, "*");
                      const isSelected =
                        filters.accountId === account.accountId;

                      return (
                        <Card
                          key={account.accountId}
                          containerStyle={tw`flex-1`}
                          variant="outline"
                          style={[
                            tw`flex-grow justify-end`,
                            isSelected && {
                              borderColor: primaryColor,
                              borderWidth: 2,
                            },
                          ]}
                          onPress={() => openAccount(account.accountId)}
                        >
                          {account.pendingCount > 0 && (
                            <ThemedView style={tw`self-start mb-2`}>
                              <Label
                                color="warning"
                                size="small"
                                text={t("reports:accounts.pending", {
                                  count: account.pendingCount,
                                })}
                              />
                            </ThemedView>
                          )}
                          <ThemedText
                            type="body2"
                            style={tw`mb-3`}
                            numberOfLines={1}
                          >
                            {account.accountName}
                          </ThemedText>
                          <ThemedText
                            type="h3"
                            style={isSelected && { color: primaryColor }}
                          >
                            {displayedAccountIncome}
                          </ThemedText>
                        </Card>
                      );
                    })}
                    {row.length === 1 && <ThemedView style={tw`flex-1`} />}
                  </ThemedView>
                ))}
              </ThemedView>
            </ThemedView>
          </ThemedView>
        )}

        {count > 0 && (
          <ThemedView style={tw`px-4`}>
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

        {/* Empty state: no incomes for the selected range / filters */}
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
        {/* Waiter Summary (no transactions yet, but orders may exist) */}
        {count === 0 && reportWaiters.length > 0 && (
          <ThemedView style={tw`px-4`}>
            <WaiterSummaryCard waiters={reportWaiters} />
          </ThemedView>
        )}

        {count > 0 && (
          <ThemedView style={tw`px-4`}>
            <PaymentMethodSummaryCard startDate={startDate} endDate={endDate} />
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

      <ThemedBottomSheetModal ref={customRangeSheetRef} enablePanDownToClose>
        <CustomDateRangeBottomSheet
          onClose={() => customRangeSheetRef.current?.dismiss()}
          onApply={handleApplyCustomRange}
          initialStartDate={customRange?.startDate}
          initialEndDate={customRange?.endDate}
        />
      </ThemedBottomSheetModal>

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
