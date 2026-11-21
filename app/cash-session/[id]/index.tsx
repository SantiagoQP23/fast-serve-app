import { useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";
import { ActionGrid } from "@intenli/ui";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency, formatDateTime, formatTime } from "@/core/i18n/utils";
import { getUserDisplayName } from "@/core/auth/utils/get-user-display-name";
import {
  CashSessionStatus,
  isRegisterHolder,
  registerHolder,
} from "@/core/cash-sessions/models/cash-session.model";
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
import Icon from "@/presentation/theme/components/icon";
import { GroupedList } from "@/presentation/theme/components/grouped-list";
import TransactionCard from "@/presentation/transactions/components/transaction-card";
import CashMovementSheet, {
  CashMovementSheetRef,
} from "@/presentation/cash-sessions/components/cash-movement-sheet";
import DifferenceLabel from "@/presentation/cash-sessions/components/difference-label";
import CashBreakdownCard from "@/presentation/cash-sessions/components/cash-breakdown-card";
import {
  useCashCountDraftKey,
  useHasCashCountDraft,
} from "@/presentation/cash-sessions/hooks/useCashCountDraft";
import { useCashCountDraftStore } from "@/presentation/cash-sessions/store/cashCountDraftStore";
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
  const movementSheetRef = useRef<CashMovementSheetRef>(null);
  const [refreshing, setRefreshing] = useState(false);

  // A count started on Close or Reassign (plans/conteo-caja-borrador.md).
  const closeDraftKey = useCashCountDraftKey("close", sessionId);
  const reassignDraftKey = useCashCountDraftKey("reassign", sessionId);
  const hasCloseDraft = useHasCashCountDraft(closeDraftKey);
  const hasReassignDraft = useHasCashCountDraft(reassignDraftKey);
  const sessionEnded = !!session && session.status !== CashSessionStatus.OPEN;
  useEffect(() => {
    if (!sessionEnded) return;
    const keys = [closeDraftKey, reassignDraftKey].filter(
      (key): key is string => !!key,
    );
    useCashCountDraftStore.getState().discard(...keys);
  }, [sessionEnded, closeDraftKey, reassignDraftKey]);

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
  const isHolder = isRegisterHolder(session, userId);
  const canClose = isOpen && (isManager || isHolder);
  const holder = registerHolder(session);
  const assignments = session.assignments ?? [];
  const userName = (user: typeof holder | undefined) =>
    getUserDisplayName(user ?? undefined, t("common:labels.deletedUser"));
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
        </ThemedView>

        {canClose && (
          <ActionGrid
            columns={4}
            items={[
              {
                icon: "lock",
                label: hasCloseDraft
                  ? t("common:cashRegister.draft.continueClosing")
                  : t("common:cashRegister.closeRegister"),
                onPress: () => router.push(`/cash-session/${session.id}/close`),
              },
              {
                icon: "arrow-down-to-line",
                label: t("common:cashRegister.deposit.action"),
                variant: "outline",
                onPress: () =>
                  movementSheetRef.current?.present("in", session.account.id),
              },
              {
                icon: "arrow-up-from-line",
                label: t("common:cashRegister.withdraw.action"),
                variant: "outline",
                onPress: () =>
                  movementSheetRef.current?.present("out", session.account.id),
              },
              {
                icon: "user-round-pen",
                label: hasReassignDraft
                  ? t("common:cashRegister.draft.continueHandover")
                  : t("common:cashRegister.reassign.action"),
                variant: "outline",
                onPress: () =>
                  router.push(`/cash-session/${session.id}/reassign`),
              },
            ]}
          />
        )}

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
          {(summary.inCount ?? 0) > 0 && (
            <DetailCardRow
              label={t("common:cashRegister.summary.added")}
              value={`+${formatCurrency(summary.cashIn)}`}
            />
          )}
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
          {(isOpen || assignments.length > 0) && (
            <DetailCardRow
              label={t("common:cashRegister.summary.responsible")}
              value={
                holder
                  ? userName(holder)
                  : t("common:cashRegister.reassign.noHolder")
              }
            />
          )}
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

        {/* Handovers (plans/reasignar-caja.md) */}
        {assignments.length > 0 && (
          <ThemedView style={tw`gap-3`}>
            <ThemedText type="h4">
              {t("common:cashRegister.reassign.history")}
            </ThemedText>
            <DetailCard style={tw`py-2`}>
              {assignments.map((assignment) => (
                <DetailCardRow
                  key={assignment.id}
                  label={`${formatTime(assignment.assignedAt)} · ${userName(
                    assignment.fromUser,
                  )} → ${userName(assignment.toUser)}`}
                >
                  {assignment.countedAmount != null ? (
                    <DifferenceLabel difference={assignment.difference} />
                  ) : (
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {t("common:cashRegister.summary.notCounted")}
                    </ThemedText>
                  )}
                </DetailCardRow>
              ))}
            </DetailCard>
            {assignments
              .filter((a) => !!a.note)
              .map((a) => (
                <ThemedText
                  key={`note-${a.id}`}
                  type="small"
                  style={tw`text-gray-500`}
                >
                  {`${formatTime(a.assignedAt)} · ${a.note}`}
                </ThemedText>
              ))}
          </ThemedView>
        )}

        {/* Movements */}
        <ThemedView style={tw`gap-3`}>
          <ThemedText type="h4">
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
        </ThemedView>
      </ScrollView>

      <CashMovementSheet ref={movementSheetRef} />
    </ScreenLayout>
  );
}
