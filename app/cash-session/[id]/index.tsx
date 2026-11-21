import { useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";
import { ActionGrid } from "@intenli/ui";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency, formatDateTime, formatTime } from "@/core/i18n/utils";
import { getUserDisplayName } from "@/core/auth/utils/get-user-display-name";
import {
  isCashDeposit,
  isCashWithdrawal,
  type Transaction,
} from "@/core/transactions/models/transaction.model";
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
  DetailCardRow,
  DetailSectionTitle,
} from "@/presentation/theme/components/detail-card";
import Label from "@/presentation/theme/components/label";
import Button from "@/presentation/theme/components/button";
import Icon from "@/presentation/theme/components/icon";
import IconButton from "@/presentation/theme/components/icon-button";
import { GroupedList } from "@/presentation/theme/components/grouped-list";
import TabBar, { type TabItem } from "@/presentation/theme/components/tab-bar";
import TabPager from "@/presentation/theme/components/tab-pager";
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

type MovementTab = "all" | "sales" | "deposits" | "withdrawals";

const movementMatchesTab = (transaction: Transaction, tab: MovementTab) => {
  switch (tab) {
    case "deposits":
      return isCashDeposit(transaction);
    case "withdrawals":
      return isCashWithdrawal(transaction);
    case "sales":
      return !isCashDeposit(transaction) && !isCashWithdrawal(transaction);
    default:
      return true;
  }
};

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
  const [movementTab, setMovementTab] = useState<MovementTab>("all");
  // Hidden until asked for, like the other money totals (incomes, history)
  const [showAmount, setShowAmount] = useState(false);
  // One scroll for the whole screen; the movements TabBar sticks once the
  // header (above it) scrolls away.
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const headerHeightRef = useRef(0);

  // Past the header, a new tab starts at its top under the pinned TabBar
  // instead of mid-way down at the old tab's scroll position.
  useEffect(() => {
    if (scrollYRef.current > headerHeightRef.current) {
      scrollRef.current?.scrollTo({
        y: headerHeightRef.current,
        animated: false,
      });
    }
  }, [movementTab]);

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
  // Open: the cash that should be in the register now (none under a blind
  // count). Closed: what was counted, or what was expected if nobody counted.
  const headerAmount = isOpen ? expected : (session.countedAmount ?? expected);
  const headerAmountLabel = isOpen
    ? t("common:cashRegister.summary.inRegister")
    : session.countedAmount != null
      ? t("common:cashRegister.summary.counted")
      : t("common:cashRegister.summary.expected");
  const formattedHeaderAmount =
    headerAmount != null ? formatCurrency(headerAmount) : null;
  // The eye also covers the totals that repeat the header amount
  const maskAmount = (formatted: string) =>
    showAmount ? formatted : formatted.replace(/\d/g, "*");

  // A type only gets a tab once it has movements; "all" is always there.
  const movementTabs: TabItem<MovementTab>[] = (
    ["all", "sales", "deposits", "withdrawals"] as const
  )
    .map((value) => ({
      value,
      label: t(`common:cashRegister.summary.movementTabs.${value}`),
      count:
        session.transactions.filter((tx) => movementMatchesTab(tx, value))
          .length || undefined,
    }))
    .filter((tab) => tab.value === "all" || !!tab.count);
  // The open tab's movements can go away (cancelled), taking its tab with it
  const activeMovementTab = movementTabs.some(
    (tab) => tab.value === movementTab,
  )
    ? movementTab
    : "all";

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <ScreenLayout style={tw`flex-1`}>
      {/* Everything scrolls; the movements TabBar (child 1) sticks at the top */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={tw`px-4 pt-2 pb-10`}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        onScroll={(e) => {
          scrollYRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ThemedView
          style={tw`gap-4 pb-3`}
          onLayout={(e) => {
            headerHeightRef.current = e.nativeEvent.layout.height;
          }}
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
            {formattedHeaderAmount != null && (
              <ThemedView style={tw`pt-2`}>
                <ThemedView style={tw`flex-row items-center gap-1`}>
                  <ThemedText type="h1">
                    {maskAmount(formattedHeaderAmount)}
                  </ThemedText>
                  <IconButton
                    icon={showAmount ? "eye-off" : "eye"}
                    variant="text"
                    accessibilityLabel={
                      showAmount
                        ? t("common:cashRegister.summary.hideAmount")
                        : t("common:cashRegister.summary.showAmount")
                    }
                    onPress={() => setShowAmount((prev) => !prev)}
                  />
                </ThemedView>
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {headerAmountLabel}
                </ThemedText>
              </ThemedView>
            )}
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
                  onPress: () =>
                    router.push(`/cash-session/${session.id}/close`),
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
                    movementSheetRef.current?.present(
                      "out",
                      session.account.id,
                    ),
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
          <ThemedView style={tw`gap-3`}>
            <DetailSectionTitle
              title={t("common:cashRegister.summary.totalsTitle")}
            />
            <ThemedView>
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
                    ? maskAmount(formatCurrency(expected))
                    : t("common:cashRegister.summary.expectedHidden")
                }
              />
              {!isOpen && (
                <>
                  <DetailCardRow
                    label={t("common:cashRegister.summary.counted")}
                    value={
                      session.countedAmount != null
                        ? maskAmount(formatCurrency(session.countedAmount))
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
            </ThemedView>
          </ThemedView>

          <CashBreakdownCard
            title={t("common:cashRegister.count.openingTitle")}
            lines={session.openingBreakdown}
          />
          <CashBreakdownCard
            title={t("common:cashRegister.count.closingTitle")}
            lines={session.countedBreakdown}
          />

          {/* Who and notes */}
          <ThemedView style={tw`gap-3`}>
            <DetailSectionTitle
              title={t("common:cashRegister.summary.detailsTitle")}
            />
            <ThemedView>
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
                <DetailCardRow
                  label={t("common:cashRegister.summary.adjusted")}
                >
                  <Icon name="info" size={18} color={tw.color("gray-500")} />
                </DetailCardRow>
              )}
            </ThemedView>
          </ThemedView>

          {/* Handovers (plans/reasignar-caja.md) */}
          {assignments.length > 0 && (
            <ThemedView style={tw`gap-3`}>
              <DetailSectionTitle
                title={t("common:cashRegister.reassign.history")}
              />
              <ThemedView>
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
              </ThemedView>
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

          <DetailSectionTitle
            title={t("common:cashRegister.summary.movements")}
          />
        </ThemedView>

        <ThemedView style={tw`bg-background`}>
          <TabBar
            scrollable
            gap={6}
            tabs={movementTabs}
            activeTab={activeMovementTab}
            onChange={setMovementTab}
          />
        </ThemedView>

        {/* Movements; drag left/right to switch type */}
        <TabPager
          tabs={movementTabs}
          activeTab={activeMovementTab}
          onChange={setMovementTab}
          autoHeight
          renderScene={(tab) => {
            const movements = session.transactions.filter((tx) =>
              movementMatchesTab(tx, tab),
            );
            return (
              <ThemedView style={tw`pt-4`}>
                {movements.length === 0 ? (
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {t("common:cashRegister.summary.noMovements")}
                  </ThemedText>
                ) : (
                  <GroupedList
                    data={movements}
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
            );
          }}
        />
      </ScrollView>

      <CashMovementSheet ref={movementSheetRef} />
    </ScreenLayout>
  );
}
