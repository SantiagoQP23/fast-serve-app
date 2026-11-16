import { useRef, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency, formatDateTime } from "@/core/i18n/utils";
import { getUserDisplayName } from "@/core/auth/utils/get-user-display-name";
import { CashSessionStatus } from "@/core/cash-sessions/models/cash-session.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import {
  DetailCard,
  DetailCardRow,
} from "@/presentation/theme/components/detail-card";
import Label from "@/presentation/theme/components/label";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Icon from "@/presentation/theme/components/icon";
import { GroupedList } from "@/presentation/theme/components/grouped-list";
import TransactionCard from "@/presentation/transactions/components/transaction-card";
import WithdrawCashSheet, {
  WithdrawCashSheetRef,
} from "@/presentation/cash-sessions/components/withdraw-cash-sheet";
import DifferenceLabel from "@/presentation/cash-sessions/components/difference-label";
import CashBreakdownCard from "@/presentation/cash-sessions/components/cash-breakdown-card";
import {
  useCashRoles,
  useCashSession,
} from "@/presentation/cash-sessions/hooks/useCashSessions";

/** One register session: totals, expected vs counted, and its movements. */
export default function CashSessionScreen() {
  const { t } = useTranslation(["common"]);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);
  const { session, isLoading, error, refetch } = useCashSession(sessionId);
  const { userId, isManager } = useCashRoles();
  const withdrawSheetRef = useRef<WithdrawCashSheetRef>(null);
  const [refreshing, setRefreshing] = useState(false);

  if (!session) {
    return (
      <ScreenLayout style={tw`flex-1 items-center justify-center px-8 gap-3`}>
        <Icon name="banknote" size={48} color={tw.color("gray-400")} />
        <ThemedText type="body2" style={tw`text-center text-gray-500`}>
          {isLoading
            ? t("common:status.loading")
            : error
              ? t("common:transactions.loadState.errorDescription")
              : t("common:cashRegister.summary.noMovements")}
        </ThemedText>
        {!isLoading && (
          <Button
            label={t("common:actions.retry")}
            variant="surface"
            size="small"
            onPress={() => refetch()}
          />
        )}
      </ScreenLayout>
    );
  }

  const isOpen = session.status === CashSessionStatus.OPEN;
  const isOpener = session.openedBy?.id === userId;
  const canClose = isOpen && (isManager || isOpener);
  const { summary } = session;
  const expected = isOpen ? summary.expectedAmount : session.expectedAmount;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ScrollView
        contentContainerStyle={tw`px-4 pt-2 pb-10 gap-4`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <ThemedView style={tw`gap-2`}>
          <ThemedView style={tw`flex-row items-center gap-2`}>
            <ThemedText type="h2" style={tw`flex-1`} numberOfLines={1}>
              {session.account.name}
            </ThemedText>
            <Label
              color={isOpen ? "success" : "default"}
              text={
                isOpen
                  ? t("common:cashRegister.open")
                  : t("common:cashRegister.closed")
              }
            />
          </ThemedView>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {isOpen
              ? formatDateTime(session.openedAt)
              : `${formatDateTime(session.openedAt)} – ${
                  session.closedAt
                    ? dayjs(session.closedAt).isSame(session.openedAt, "day")
                      ? dayjs(session.closedAt).format("HH:mm")
                      : formatDateTime(session.closedAt)
                    : ""
                }`}
          </ThemedText>
          {(canClose || isOpen) && (
            <ThemedView style={tw`flex-row flex-wrap gap-3 mt-1`}>
              {canClose && (
                <Button
                  label={t("common:cashRegister.closeRegister")}
                  leftIcon="lock"
                  shape="rounded"
                  size="small"
                  onPress={() =>
                    router.push(`/cash-session/${session.id}/close`)
                  }
                />
              )}
              {(isManager || isOpener) && (
                <Button
                  label={t("common:cashRegister.withdraw.action")}
                  leftIcon="arrow-up-from-line"
                  variant="surface"
                  shape="rounded"
                  size="small"
                  onPress={() =>
                    withdrawSheetRef.current?.present(session.account.id)
                  }
                />
              )}
            </ThemedView>
          )}
        </ThemedView>

        {/* Totals */}
        <DetailCard style={tw`py-2`}>
          <DetailCardRow
            label={t("common:cashRegister.summary.opening")}
            value={formatCurrency(summary.openingAmount)}
          />
          <DetailCardRow
            label={t("common:cashRegister.summary.income")}
            value={`+${formatCurrency(summary.cashIncome)}`}
          />
          <DetailCardRow
            label={t("common:cashRegister.summary.out")}
            value={`−${formatCurrency(summary.cashOut)}`}
          />
          {summary.pendingCount > 0 && (
            <DetailCardRow
              label={t("common:cashRegister.summary.pending")}
              value={`−${formatCurrency(summary.pendingOut)}`}
            />
          )}
          <DetailCardRow
            label={t("common:cashRegister.summary.expected")}
            value={
              expected != null
                ? formatCurrency(expected)
                : t("common:cashRegister.summary.expectedHidden")
            }
          />
          {!isOpen && (
            <>
              <DetailCardRow
                label={t("common:cashRegister.summary.counted")}
                value={
                  session.countedAmount != null
                    ? formatCurrency(session.countedAmount)
                    : t("common:cashRegister.summary.notCounted")
                }
              />
              <DetailCardRow
                label={t("common:cashRegister.summary.difference")}
              >
                <DifferenceLabel difference={session.difference} />
              </DetailCardRow>
            </>
          )}
        </DetailCard>

        <CashBreakdownCard
          title={t("common:cashRegister.count.openingTitle")}
          lines={session.openingBreakdown}
        />
        <CashBreakdownCard
          title={t("common:cashRegister.count.closingTitle")}
          lines={session.countedBreakdown}
        />

        {/* Who and notes */}
        <DetailCard style={tw`py-2`}>
          <DetailCardRow
            label={t("common:cashRegister.summary.openedBy")}
            value={getUserDisplayName(
              session.openedBy ?? undefined,
              t("common:labels.deletedUser"),
            )}
          />
          {!isOpen && (
            <DetailCardRow
              label={t("common:cashRegister.summary.closedBy")}
              value={getUserDisplayName(
                session.closedBy ?? undefined,
                t("common:labels.deletedUser"),
              )}
            />
          )}
          {!!session.note && (
            <DetailCardRow
              label={t("common:cashRegister.summary.note")}
              value={session.note}
            />
          )}
          {session.adjustedAfterClose && (
            <DetailCardRow label={t("common:cashRegister.summary.adjusted")}>
              <Icon name="info" size={18} color={tw.color("gray-500")} />
            </DetailCardRow>
          )}
        </DetailCard>

        {/* Movements */}
        <Card>
          <ThemedText type="h4" style={tw`mb-3`}>
            {t("common:cashRegister.summary.movements")}
          </ThemedText>
          {session.transactions.length === 0 ? (
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("common:cashRegister.summary.noMovements")}
            </ThemedText>
          ) : (
            <GroupedList
              data={session.transactions}
              keyExtractor={(item) => item.id.toString()}
              renderItem={(item) => (
                <TransactionCard
                  transaction={item}
                  onPress={() => router.push(`/transaction/${item.id}`)}
                />
              )}
            />
          )}
        </Card>
      </ScrollView>

      <WithdrawCashSheet ref={withdrawSheetRef} />
    </ScreenLayout>
  );
}
