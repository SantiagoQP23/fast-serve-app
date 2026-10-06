import { RefreshControl, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatDateTime } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Fab from "@/presentation/theme/components/fab";
import Label from "@/presentation/theme/components/label";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import { useInventoryCounts } from "@/presentation/inventory/hooks/useInventoryCounts";
import {
  InventoryCountStatus,
  getCountUserName,
  type InventoryCount,
} from "@/core/inventory/models/inventory-count.model";

export default function MenuInventoryCountsScreen() {
  const { t } = useTranslation("inventory");
  const { countsQuery, counts, hasMore, isLoadingMore, loadMore, refresh } =
    useInventoryCounts();

  const openCount = (count: InventoryCount) =>
    router.push({
      pathname: "/(profile)/menu-inventory-count-detail",
      params: { countId: count.id },
    });

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ThemedView style={tw`px-4 pt-8 bg-transparent`}>
        <InventoryScreenHeader title={t("counts.title")} />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 gap-3.5 pb-24 pt-6`}
        refreshControl={
          <RefreshControl
            refreshing={countsQuery.isFetching && !isLoadingMore}
            onRefresh={refresh}
          />
        }
      >
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
                {t("counts.empty")}
              </ThemedText>
              <ThemedText
                type="body2"
                style={tw`text-center text-gray-500 px-4`}
              >
                {t("counts.emptyDescription")}
              </ThemedText>
            </ThemedView>
          )}

        {counts.map((count) => {
          const creator = getCountUserName(count.createdBy);
          const inProgress = count.status === InventoryCountStatus.IN_PROGRESS;
          return (
            <Card key={count.id} onPress={() => openCount(count)}>
              <ThemedView style={tw`gap-2 bg-transparent`}>
                <ThemedView
                  style={tw`flex-row justify-between items-center gap-2 bg-transparent`}
                >
                  <ThemedText type="h4" style={tw`flex-1`}>
                    {formatDateTime(count.createdAt)}
                  </ThemedText>
                  <Label
                    text={t(`counts.countStatus.${count.status}`)}
                    color={inProgress ? "info" : "success"}
                    size="small"
                  />
                </ThemedView>
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {t("counts.summaryLine", {
                    products: count.itemsCount ?? 0,
                    adjusted: count.adjustedCount ?? 0,
                    unanswered: count.pendingCount ?? 0,
                  })}
                </ThemedText>
                {creator && (
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("counts.startedBy", { name: creator })}
                  </ThemedText>
                )}
              </ThemedView>
            </Card>
          );
        })}

        {hasMore && (
          <Button
            label={t("common:actions.loadMore")}
            variant="outline"
            loading={isLoadingMore}
            onPress={loadMore}
          />
        )}
      </ScrollView>

      <Fab
        icon="clipboard-outline"
        label={t("counts.new")}
        onPress={() =>
          router.push({ pathname: "/(profile)/menu-inventory-count-items" })
        }
      />
    </ScreenLayout>
  );
}
