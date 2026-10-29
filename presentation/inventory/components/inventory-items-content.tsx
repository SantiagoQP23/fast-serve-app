import { useCallback, useMemo, useState } from "react";
import {
  BackHandler,
  Pressable,
  RefreshControl,
  ScrollView,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { typography } from "@/constants/theme";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { canManageInventory } from "@/core/auth/models/user.model";
import Button from "@/presentation/theme/components/button";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useInventoryItemCategories } from "@/presentation/inventory/hooks/useInventoryItemCategories";
import InventoryCategoryBrowser from "@/presentation/inventory/components/inventory-category-browser";
import InventoryStockSummary from "@/presentation/inventory/components/inventory-stock-summary";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import InventorySplitLayout from "@/presentation/inventory/components/inventory-split-layout";
import InventoryItemDetailView from "@/presentation/inventory/components/inventory-item-detail-view";
import {
  getInventoryStockStatus,
  isProductStockItem,
  type InventoryItem,
  type InventoryStockStatus,
} from "@/core/inventory/models/inventory-item.model";
import { InventoryItemStockStatusFilter } from "@/presentation/inventory/interfaces/dto/find-all-inventory-items.dto";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";

const STATUS_BY_FILTER: Record<
  InventoryItemStockStatusFilter,
  InventoryStockStatus
> = {
  [InventoryItemStockStatusFilter.CRITICAL]: "critical",
  [InventoryItemStockStatusFilter.LOW]: "low",
  [InventoryItemStockStatusFilter.OPTIMAL]: "optimal",
  [InventoryItemStockStatusFilter.NO_MINIMUM]: "noMinimum",
};

/** The Insumos page: insumos grouped by category, filterable by status. */
export default function InventoryItemsContent() {
  const { t } = useTranslation("inventory");
  const { user } = useAuthStore();
  const canManage = canManageInventory(user?.role?.name);
  const { items: allItems, itemsQuery: catalogQuery } = useInventoryItems();
  // Variant stock shows on its variant (Menú page), not among the insumos.
  const catalogItems = useMemo(
    () => allItems.filter((item) => !isProductStockItem(item)),
    [allItems],
  );
  const { categories, categoriesQuery } = useInventoryItemCategories();

  // Status chips filter the insumos in place, like the Menú's stock chips.
  const [statusFilter, setStatusFilter] =
    useState<InventoryItemStockStatusFilter | null>(null);

  // Tablet landscape: the item opens in a pane next to the list instead of
  // pushing a screen.
  const { isExpanded } = useResponsiveLayout();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const openItem = (item: InventoryItem) => {
    if (isExpanded) {
      setSelectedId(item.id);
      return;
    }
    router.push({
      pathname: "/(profile)/inventory/items/detail",
      params: { itemId: item.id },
    });
  };

  // Counted over the loaded catalog so each chip matches what it shows.
  const statusCounts = useMemo(() => {
    const counts = { critical: 0, low: 0, optimal: 0, noMinimum: 0 };
    for (const item of catalogItems) {
      const status = getInventoryStockStatus(item);
      if (status !== "inactive") counts[status] += 1;
    }
    return counts;
  }, [catalogItems]);

  const filteredItems = useMemo(
    () =>
      statusFilter
        ? catalogItems.filter(
            (item) =>
              getInventoryStockStatus(item) === STATUS_BY_FILTER[statusFilter],
          )
        : catalogItems,
    [catalogItems, statusFilter],
  );

  // Back clears the status filter before it leaves the screen
  const hasBackStep = !!statusFilter;
  useFocusEffect(
    useCallback(() => {
      if (!hasBackStep) return;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          setStatusFilter(null);
          return true;
        },
      );
      return () => subscription.remove();
    }, [hasBackStep]),
  );

  const handleRefresh = () =>
    Promise.all([catalogQuery.refetch(), categoriesQuery.refetch()]);

  const hasContent = catalogItems.length > 0 || categories.length > 0;

  const list = (
    <>
      <ThemedView style={tw`px-4 pt-8 bg-transparent`}>
        <InventoryScreenHeader
          title={t("tabs.inventory")}
          right={
            <Pressable
              onPress={() =>
                router.push({ pathname: "/(profile)/inventory/search" })
              }
              hitSlop={13}
              style={({ pressed }) => tw.style(pressed && "opacity-70")}
              accessibilityLabel={t("searchPlaceholder")}
              accessibilityRole="button"
            >
              <Icon name="search" color={tw.color("on-surface")} size={22} />
            </Pressable>
          }
        />
      </ThemedView>

      <ThemedView style={tw`flex-1 px-4 pt-6 gap-6 bg-transparent`}>
        {canManage && (
          <Button
            label={t("createItem")}
            leftIcon="plus"
            variant="outline"
            onPress={() =>
              router.push({ pathname: "/(profile)/inventory/items/form" })
            }
          />
        )}

        {!catalogQuery.isLoading &&
          !catalogQuery.isError &&
          catalogItems.length > 0 && (
            <ThemedView style={tw`gap-2 bg-transparent`}>
              <InventoryStockSummary
                counts={statusCounts}
                selectedStatus={statusFilter}
                onSelectStatus={setStatusFilter}
              />
              {/* Without results the empty state says it and offers the
                  way out */}
              {statusFilter && filteredItems.length > 0 && (
                <ThemedView
                  style={tw`flex-row items-center justify-between gap-2 bg-transparent`}
                >
                  <ThemedText
                    type="body2"
                    style={tw`flex-1 text-gray-500`}
                    numberOfLines={1}
                  >
                    {[
                      t(`status.${STATUS_BY_FILTER[statusFilter]}`),
                      t("categories.itemCount", {
                        count: filteredItems.length,
                      }),
                    ].join(" · ")}
                  </ThemedText>
                  <Button
                    label={t("filter.clear")}
                    variant="link"
                    size="small"
                    leftIcon="x"
                    onPress={() => setStatusFilter(null)}
                  />
                </ThemedView>
              )}
            </ThemedView>
          )}

        {statusFilter && filteredItems.length === 0 ? (
          <ThemedView style={tw`items-center py-8 gap-3 bg-transparent`}>
            <Icon name="circle-check" size={48} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={tw`text-center text-gray-500 px-4`}>
              {t(`filter.empty.${STATUS_BY_FILTER[statusFilter]}`)}
            </ThemedText>
            <Button
              label={t("filter.clear")}
              variant="outline"
              onPress={() => setStatusFilter(null)}
            />
          </ThemedView>
        ) : !catalogQuery.isLoading && !catalogQuery.isError && hasContent ? (
          <InventoryCategoryBrowser
            items={filteredItems}
            hideEmptyGroups={!!statusFilter}
            categories={categories}
            onOpenItem={openItem}
            activeId={isExpanded ? (selectedId ?? undefined) : undefined}
            refreshing={catalogQuery.isFetching}
            onRefresh={handleRefresh}
            onManageCategories={
              canManage
                ? () =>
                    router.push({ pathname: "/(profile)/inventory/categories" })
                : undefined
            }
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tw`pb-8`}
            refreshControl={
              <RefreshControl
                refreshing={catalogQuery.isFetching}
                onRefresh={handleRefresh}
                tintColor={tw.color("primary")}
                colors={[tw.color("primary") as string]}
              />
            }
          >
            {catalogQuery.isLoading && (
              <ThemedView style={tw`items-center py-8 gap-3`}>
                <ThemedText type="body1" style={tw`text-gray-500`}>
                  {t("loading")}
                </ThemedText>
              </ThemedView>
            )}

            {catalogQuery.isError && (
              <ThemedView style={tw`items-center py-8 gap-3`}>
                <Icon
                  name="circle-alert"
                  size={48}
                  color={tw.color("red-500")}
                />
                <ThemedText type="body1" style={tw`text-red-500`}>
                  {t("loadError")}
                </ThemedText>
                <Button
                  label={t("retry")}
                  onPress={() => catalogQuery.refetch()}
                  variant="outline"
                />
              </ThemedView>
            )}

            {!catalogQuery.isLoading && !catalogQuery.isError && (
              <ThemedView style={tw`items-center py-8 gap-3`}>
                <Icon name="package" size={48} color={tw.color("gray-400")} />
                <ThemedText
                  type="body1"
                  style={{ fontFamily: typography.semibold }}
                >
                  {t("empty")}
                </ThemedText>
                <ThemedText
                  type="body2"
                  style={tw`text-center text-gray-500 px-4`}
                >
                  {t("emptyDescription")}
                </ThemedText>
              </ThemedView>
            )}
          </ScrollView>
        )}
      </ThemedView>
    </>
  );

  if (!isExpanded) return list;

  return (
    <InventorySplitLayout
      list={list}
      emptyIcon="package"
      emptyText={t("pane.selectItem")}
      pane={
        selectedId ? (
          <InventoryItemDetailView
            key={selectedId}
            itemId={selectedId}
            embedded
            onClose={() => setSelectedId(null)}
          />
        ) : null
      }
    />
  );
}
