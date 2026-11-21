import { useMemo, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import dayjs from "dayjs";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  formatCurrency,
  formatDate,
  formatTime,
  groupByDay,
} from "@/core/i18n/utils";
import {
  CashSession,
  CashSessionStatus,
} from "@/core/cash-sessions/models/cash-session.model";
import {
  DateRangeFilter,
  getDateRangeFor,
} from "@/core/orders/enums/date-range-filter.enum";
import tw from "@/presentation/theme/lib/tailwind";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Chip from "@/presentation/theme/components/chip";
import Card from "@/presentation/theme/components/card";
import Label from "@/presentation/theme/components/label";
import Icon from "@/presentation/theme/components/icon";
import DaySectionHeader from "@/presentation/inventory/components/day-section-header";
import DifferenceLabel from "@/presentation/cash-sessions/components/difference-label";
import { useCashSessionsHistory } from "@/presentation/cash-sessions/hooks/useCashSessions";

const RANGES = [
  DateRangeFilter.TODAY,
  DateRangeFilter.WEEK_TO_DATE,
  DateRangeFilter.MONTH_TO_DATE,
] as const;

/** Closing time; carries its date when the register closed on a later day. */
const closedAtText = (session: CashSession) =>
  dayjs(session.closedAt).isSame(session.openedAt, "day")
    ? formatTime(session.closedAt!)
    : `${formatDate(session.closedAt!)} ${formatTime(session.closedAt!)}`;

/**
 * "Cierres de caja", grouped by the day each register opened: owner/admin see
 * every register, cashiers their own.
 */
export default function CashSessionsHistoryScreen() {
  const { t } = useTranslation(["common"]);
  const router = useRouter();
  const [range, setRange] = useState<DateRangeFilter>(DateRangeFilter.TODAY);
  const [refreshing, setRefreshing] = useState(false);

  const filter = useMemo(() => {
    const { startDate, endDate } = getDateRangeFor(range);
    return {
      startDate: dayjs(startDate).format("YYYY-MM-DD"),
      endDate: dayjs(endDate).format("YYYY-MM-DD"),
      limit: 100,
    };
  }, [range]);

  const { sessions, isLoading, refetch } = useCashSessionsHistory(filter);
  const days = useMemo(
    () => groupByDay(sessions, (session) => session.openedAt),
    [sessions],
  );

  const labels: Record<string, string> = {
    [DateRangeFilter.TODAY]: t("common:stats.dateRange.today"),
    [DateRangeFilter.WEEK_TO_DATE]: t("common:stats.dateRange.weekToDate"),
    [DateRangeFilter.MONTH_TO_DATE]: t("common:stats.dateRange.monthToDate"),
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderSession = (session: CashSession) => {
    const isOpen = session.status === CashSessionStatus.OPEN;
    const who = [session.openedBy, session.responsible, session.closedBy]
      .filter(Boolean)
      .map((u) => u?.person?.firstName)
      .filter((name, i, all) => name && all.indexOf(name) === i)
      .join(" → ");
    return (
      <Card
        key={session.id}
        variant="outline"
        style={tw`gap-2`}
        onPress={() => router.push(`/cash-session/${session.id}`)}
      >
        <ThemedView style={tw`flex-row items-center gap-2`}>
          <ThemedText type="body1" style={tw`flex-1`} numberOfLines={1}>
            {session.account.name}
          </ThemedText>
          {isOpen ? (
            <Label
              size="small"
              color="success"
              text={t("common:cashRegister.open")}
            />
          ) : (
            <DifferenceLabel difference={session.difference} />
          )}
        </ThemedView>
        <ThemedText type="small" style={tw`text-gray-500`}>
          {`${formatTime(session.openedAt)}${
            session.closedAt ? ` – ${closedAtText(session)}` : ""
          }${who ? ` · ${who}` : ""}${
            session.assignmentCount
              ? ` · ${t("common:cashRegister.reassign.count", {
                  count: session.assignmentCount,
                })}`
              : ""
          }`}
        </ThemedText>
        {!isOpen && (
          <ThemedText type="small" style={tw`text-gray-500`}>
            {`${t("common:cashRegister.summary.expected")}: ${
              session.expectedAmount != null
                ? formatCurrency(session.expectedAmount)
                : "—"
            } · ${t("common:cashRegister.summary.counted")}: ${
              session.countedAmount != null
                ? formatCurrency(session.countedAmount)
                : t("common:cashRegister.summary.notCounted")
            }`}
          </ThemedText>
        )}
        {session.adjustedAfterClose && (
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("common:cashRegister.summary.adjusted")}
          </ThemedText>
        )}
      </Card>
    );
  };

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ThemedView style={tw`px-4 pb-4 gap-4`}>
        <ThemedText type="h2">{t("common:cashRegister.history")}</ThemedText>
        <ThemedView style={tw`flex-row gap-2`}>
          {RANGES.map((r) => (
            <Chip
              key={r}
              label={labels[r]}
              selected={range === r}
              onPress={() => setRange(r)}
            />
          ))}
        </ThemedView>
      </ThemedView>
      <ScrollView
        contentContainerStyle={tw`px-4 pb-10 gap-6`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {sessions.length === 0 ? (
          <ThemedView style={tw`items-center py-12 gap-3`}>
            <Icon name="banknote" size={48} color={tw.color("gray-300")} />
            <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
              {isLoading
                ? t("common:status.loading")
                : t("common:empty.noData")}
            </ThemedText>
          </ThemedView>
        ) : (
          days.map(({ day, items }) => (
            <ThemedView key={day} style={tw`gap-3 bg-transparent`}>
              <DaySectionHeader day={day} />
              {items.map(renderSession)}
            </ThemedView>
          ))
        )}
      </ScrollView>
    </ScreenLayout>
  );
}
