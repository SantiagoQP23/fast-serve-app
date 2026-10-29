import { useMemo, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { groupByDay } from "@/core/i18n/utils";
import Button from "@/presentation/theme/components/button";
import TabBar, { type TabItem } from "@/presentation/theme/components/tab-bar";
import TabPager from "@/presentation/theme/components/tab-pager";
import DaySectionHeader from "@/presentation/inventory/components/day-section-header";
import InventoryCountCard from "@/presentation/inventory/components/inventory-count-card";
import { useInventoryCounts } from "@/presentation/inventory/hooks/useInventoryCounts";
import {
  InventoryCountStatus,
  type InventoryCount,
} from "@/core/inventory/models/inventory-count.model";

interface InventoryCountsTabProps {
  /** Shows a full-width "new count" button at the top of the list. */
  onAdd?: () => void;
  /** Overrides navigating to the count screen, e.g. to open a side pane. */
  onOpenCount?: (count: InventoryCount) => void;
  /** Count currently shown in the side pane. */
  activeId?: string;
}

/** Counts split into In progress / Completed pages under a pinned tab bar. */
export default function InventoryCountsTab({
  onAdd,
  onOpenCount,
  activeId,
}: InventoryCountsTabProps) {
  const { t } = useTranslation("inventory");
  // Opens on what still needs finishing; there's no "All" view.
  const [status, setStatus] = useState<InventoryCountStatus>(
    InventoryCountStatus.IN_PROGRESS,
  );

  const statusTabs: TabItem<InventoryCountStatus>[] = [
    {
      label: t("counts.countStatus.IN_PROGRESS"),
      value: InventoryCountStatus.IN_PROGRESS,
    },
    {
      label: t("counts.countStatus.COMPLETED"),
      value: InventoryCountStatus.COMPLETED,
    },
  ];

  return (
    <ThemedView style={tw`flex-1 bg-transparent`}>
      <ThemedView style={tw`px-4 pt-4 bg-transparent`}>
        <TabBar tabs={statusTabs} activeTab={status} onChange={setStatus} />
      </ThemedView>
      {/* Drag left/right to switch between in progress and completed */}
      <TabPager
        tabs={statusTabs}
        activeTab={status}
        onChange={setStatus}
        renderScene={(value) => (
          <CountsList
            status={value}
            onAdd={onAdd}
            onOpenCount={onOpenCount}
            activeId={activeId}
          />
        )}
      />
    </ThemedView>
  );
}

interface CountsListProps extends InventoryCountsTabProps {
  status: InventoryCountStatus;
}

/** One page of the pager: the counts with one status, grouped by day. */
function CountsList({ status, onAdd, onOpenCount, activeId }: CountsListProps) {
  const { t } = useTranslation("inventory");
  const { countsQuery, counts, hasMore, isLoadingMore, loadMore, refresh } =
    useInventoryCounts(status);
  const days = useMemo(
    () => groupByDay(counts, (count) => count.createdAt),
    [counts],
  );

  const openCount = (count: InventoryCount) =>
    onOpenCount
      ? onOpenCount(count)
      : router.push({
          pathname: "/(profile)/inventory/counts/detail",
          params: { countId: count.id },
        });

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={tw`px-4 gap-6 pb-8 pt-6`}
      refreshControl={
        <RefreshControl
          refreshing={countsQuery.isFetching && !isLoadingMore}
          onRefresh={refresh}
        />
      }
    >
      {onAdd && (
        <Button
          label={t("counts.new")}
          leftIcon="plus"
          variant="outline"
          onPress={onAdd}
        />
      )}
      {countsQuery.isLoading && !isLoadingMore && (
        <ThemedText type="body1" style={tw`text-gray-500 text-center py-8`}>
          {t("loading")}
        </ThemedText>
      )}

      {countsQuery.isError && (
        <ThemedView style={tw`items-center py-8 gap-3`}>
          <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
          <ThemedText type="body1" style={tw`text-red-500`}>
            {t("counts.loadError")}
          </ThemedText>
          <Button
            label={t("retry")}
            onPress={() => countsQuery.refetch()}
            variant="outline"
          />
        </ThemedView>
      )}

      {!countsQuery.isLoading &&
        !countsQuery.isError &&
        counts.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="clipboard" size={48} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("counts.emptyFiltered")}
            </ThemedText>
          </ThemedView>
        )}

      {days.map(({ day, items }) => (
        <ThemedView key={day} style={tw`gap-3 bg-transparent`}>
          <DaySectionHeader day={day} />
          {items.map((count) => (
            <InventoryCountCard
              key={count.id}
              count={count}
              onPress={openCount}
              active={activeId === count.id}
            />
          ))}
        </ThemedView>
      ))}

      {hasMore && (
        <Button
          label={t("common:actions.loadMore")}
          variant="outline"
          loading={isLoadingMore}
          onPress={loadMore}
        />
      )}
    </ScrollView>
  );
}
