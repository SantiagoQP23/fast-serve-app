import { useMemo } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { groupByDay } from "@/core/i18n/utils";
import Button from "@/presentation/theme/components/button";
import DraftPurchaseCard from "@/presentation/inventory/components/draft-purchase-card";
import DaySectionHeader from "@/presentation/inventory/components/day-section-header";
import InventoryPurchaseCard from "@/presentation/inventory/components/inventory-purchase-card";
import ShoppingListCard from "@/presentation/inventory/components/shopping-list-card";
import { useInventoryPurchases } from "@/presentation/inventory/hooks/useInventoryPurchases";
import { type InventoryPurchase } from "@/core/inventory/models/inventory-purchase.model";

interface InventoryPurchasesTabProps {
  /** Overrides navigating to the purchase screen, e.g. to open a side pane. */
  onOpenPurchase?: (purchase: InventoryPurchase) => void;
  /** Purchase currently shown in the side pane. */
  activeId?: string;
}

export default function InventoryPurchasesTab({
  onOpenPurchase,
  activeId,
}: InventoryPurchasesTabProps) {
  const { t } = useTranslation("inventory");
  const {
    purchasesQuery,
    purchases,
    hasMore,
    isLoadingMore,
    loadMore,
    refresh,
  } = useInventoryPurchases();
  const days = useMemo(
    () => groupByDay(purchases, (purchase) => purchase.createdAt),
    [purchases],
  );

  const openPurchase = (purchase: InventoryPurchase) =>
    onOpenPurchase
      ? onOpenPurchase(purchase)
      : router.push({
          pathname: "/(profile)/inventory/purchases/detail",
          params: { purchaseId: purchase.id },
        });

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={tw`px-4 gap-6 pb-28 pt-6`}
      refreshControl={
        <RefreshControl
          refreshing={purchasesQuery.isFetching && !isLoadingMore}
          onRefresh={refresh}
        />
      }
    >
      <DraftPurchaseCard />
      <ShoppingListCard />

      {purchasesQuery.isLoading && !isLoadingMore && (
        <ThemedText type="body1" style={tw`text-gray-500 text-center py-8`}>
          {t("loading")}
        </ThemedText>
      )}

      {purchasesQuery.isError && (
        <ThemedView style={tw`items-center py-8 gap-3`}>
          <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
          <ThemedText type="body1" style={tw`text-red-500`}>
            {t("purchases.loadError")}
          </ThemedText>
          <Button
            label={t("retry")}
            onPress={() => purchasesQuery.refetch()}
            variant="outline"
          />
        </ThemedView>
      )}

      {!purchasesQuery.isLoading &&
        !purchasesQuery.isError &&
        purchases.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="receipt-text" size={48} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("purchases.empty")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("purchases.emptyDescription")}
            </ThemedText>
          </ThemedView>
        )}

      {days.map(({ day, items }) => (
        <ThemedView key={day} style={tw`gap-3 bg-transparent`}>
          <DaySectionHeader day={day} />
          {items.map((purchase) => (
            <InventoryPurchaseCard
              key={purchase.id}
              purchase={purchase}
              onPress={openPurchase}
              active={activeId === purchase.id}
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
