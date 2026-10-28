import { useCallback, useMemo, useState } from "react";
import { ScrollView, RefreshControl, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";
import * as Haptics from "expo-haptics";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency, formatDate } from "@/core/i18n/utils";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useTransactionsList } from "@/presentation/transactions/hooks/useTransactionsList";
import { useTransactionPaymentMethodReport } from "@/presentation/transactions/hooks/useTransactionPaymentMethodReport";
import TransactionCard from "@/presentation/transactions/components/transaction-card";
import TransactionStatusChips from "@/presentation/transactions/components/transaction-status-chips";
import { TransactionStatus } from "@/core/transactions/models/transaction-status.enum";
import { GroupedList } from "@/presentation/theme/components/grouped-list";
import Button from "@/presentation/theme/components/button";
import Icon from "@/presentation/theme/components/icon";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";

type TransactionsListParams = {
  startDate?: string;
  endDate?: string;
  paymentMethodId?: string;
  accountId?: string;
  createdById?: string;
};

const toNumber = (value?: string) => (value ? Number(value) : undefined);

// Full, paginated list behind the Incomes tab's "See all" (same day + filters).
// With an accountId it doubles as the account screen: account name + total.
export default function TransactionsListScreen() {
  const { t } = useTranslation(["common", "errors"]);
  const router = useRouter();
  const params = useLocalSearchParams<TransactionsListParams>();
  const primaryColor = useThemeColor({}, "primary");
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<TransactionStatus | null>(null);

  const {
    transactions,
    count,
    statusCounts,
    isLoading,
    isLoadingMore,
    refetch,
    loadMore,
    reset,
    hasMore,
  } = useTransactionsList({
    startDate: params.startDate,
    endDate: params.endDate,
    paymentMethodId: toNumber(params.paymentMethodId),
    accountId: toNumber(params.accountId),
    createdById: params.createdById || undefined,
    status: status ?? undefined,
  });

  // Keep the last counts while a new status loads so the chips don't blink out
  const [chipCounts, setChipCounts] = useState<
    Partial<Record<TransactionStatus, number>>
  >({});
  if (statusCounts && statusCounts !== chipCounts) setChipCounts(statusCounts);

  const handleSelectStatus = (next: TransactionStatus | null) => {
    reset();
    setStatus(next);
  };

  // Same report the Incomes account cards read, so the total matches the card
  const accountId = toNumber(params.accountId);
  const { paymentMethodReport, refetch: refetchReport } =
    useTransactionPaymentMethodReport({
      startDate: params.startDate,
      endDate: params.endDate,
    });
  const account = useMemo(() => {
    if (!accountId || !paymentMethodReport?.report) return undefined;
    const listed = paymentMethodReport.accounts?.find(
      (a) => a.accountId === accountId,
    );
    if (listed) return listed;
    let accountName = "";
    let totalIncome = 0;
    paymentMethodReport.report.forEach((pm) => {
      pm.incomeByAccount.forEach((a) => {
        if (a.accountId !== accountId) return;
        accountName = a.accountName;
        totalIncome += a.totalIncome;
      });
    });
    return { accountName, totalIncome };
  }, [accountId, paymentMethodReport]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Promise.all([refetch(), accountId ? refetchReport() : null]);
    } catch {
      Alert.alert(
        t("errors:order.fetchError"),
        t("errors:order.ordersFetchFailed"),
      );
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refetchReport, accountId, t]);

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ScrollView
        contentContainerStyle={tw`px-4 pb-20`}
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
        <ThemedView style={tw`mb-4 gap-1`}>
          <ThemedText type="h2">
            {account?.accountName || t("common:navigation.incomes")}
          </ThemedText>
          <ThemedText type="small" style={tw`text-gray-500`}>
            {params.startDate ? formatDate(dayjs(params.startDate)) : ""}
            {params.endDate && params.endDate !== params.startDate
              ? ` – ${formatDate(dayjs(params.endDate))}`
              : ""}
            {count > 0 ? ` · ${count} transactions` : ""}
          </ThemedText>
        </ThemedView>

        {account && (
          <ThemedView style={tw`mb-6 gap-1`}>
            <ThemedText type="small">{t("common:labels.total")}</ThemedText>
            <ThemedText style={tw`text-5xl`}>
              {formatCurrency(account.totalIncome)}
            </ThemedText>
          </ThemedView>
        )}

        <ThemedView style={tw`mb-4`}>
          <TransactionStatusChips
            counts={chipCounts}
            selectedStatus={status}
            onSelectStatus={handleSelectStatus}
          />
        </ThemedView>

        {isLoading && !refreshing && transactions.length === 0 ? (
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
                  onPress={() => router.push(`/transaction/${item.id}`)}
                />
              )}
            />

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
            <Icon name="receipt-text" size={64} color={tw.color("gray-300")} />
            <ThemedText type="h4" style={tw`text-gray-500 mt-4 text-center`}>
              {t("common:empty.noIncomes")}
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}
