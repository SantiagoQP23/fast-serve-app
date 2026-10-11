import { useMemo, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { groupByDayAndHour } from "@/core/i18n/utils";
import Button from "@/presentation/theme/components/button";
import Chip from "@/presentation/theme/components/chip";
import DaySectionHeader, {
  HourSectionHeader,
} from "@/presentation/inventory/components/day-section-header";
import InventoryCountCard from "@/presentation/inventory/components/inventory-count-card";
import { useInventoryCounts } from "@/presentation/inventory/hooks/useInventoryCounts";
import {
  InventoryCountStatus,
  type InventoryCount,
} from "@/core/inventory/models/inventory-count.model";

export default function InventoryCountsTab() {
  const { t } = useTranslation("inventory");
  const [status, setStatus] = useState<InventoryCountStatus | undefined>();
  const { countsQuery, counts, hasMore, isLoadingMore, loadMore, refresh } =
    useInventoryCounts(status);
  const days = useMemo(
    () => groupByDayAndHour(counts, (count) => count.createdAt),
    [counts],
  );

  const statusFilters: { label: string; value?: InventoryCountStatus }[] = [
    { label: t("common:filters.all") },
    {
      label: t("counts.countStatus.IN_PROGRESS"),
      value: InventoryCountStatus.IN_PROGRESS,
    },
    {
      label: t("counts.countStatus.COMPLETED"),
      value: InventoryCountStatus.COMPLETED,
    },
  ];

  const openCount = (count: InventoryCount) =>
    router.push({
      pathname: "/(profile)/menu-inventory-count-detail",
      params: { countId: count.id },
    });

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={tw`px-4 gap-6 pb-28 pt-6`}
      refreshControl={
        <RefreshControl
          refreshing={countsQuery.isFetching && !isLoadingMore}
          onRefresh={refresh}
        />
      }
    >
      <ThemedView style={tw`flex-row flex-wrap gap-2 bg-transparent`}>
        {statusFilters.map((filter) => (
          <Chip
            key={filter.value ?? "all"}
            label={filter.label}
            selected={status === filter.value}
            onPress={() => setStatus(filter.value)}
          />
        ))}
      </ThemedView>

      {countsQuery.isLoading && !isLoadingMore && (
        <ThemedText type="body1" style={tw`text-gray-500 text-center py-8`}>
          {t("loading")}
        </ThemedText>
      )}

      {countsQuery.isError && (
        <ThemedView style={tw`items-center py-8 gap-3`}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
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
            <Ionicons name="clipboard-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {status ? t("counts.emptyFiltered") : t("counts.empty")}
            </ThemedText>
            {!status && (
              <ThemedText
                type="body2"
                style={tw`text-center text-gray-500 px-4`}
              >
                {t("counts.emptyDescription")}
              </ThemedText>
            )}
          </ThemedView>
        )}

      {days.map(({ day, hours }) => (
        <ThemedView key={day} style={tw`gap-4 bg-transparent`}>
          <DaySectionHeader day={day} />
          {hours.map(({ hour, items }) => (
            <ThemedView key={hour} style={tw`gap-3 bg-transparent`}>
              <HourSectionHeader hour={hour} />
              {items.map((count) => (
                <InventoryCountCard
                  key={count.id}
                  count={count}
                  onPress={openCount}
                />
              ))}
            </ThemedView>
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
