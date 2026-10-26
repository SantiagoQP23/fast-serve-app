import { useCallback, useMemo, useState } from "react";
import {
  BackHandler,
  ScrollView,
  RefreshControl,
  Pressable,
  View,
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
import TabBar, { type TabItem } from "@/presentation/theme/components/tab-bar";
import TabPager from "@/presentation/theme/components/tab-pager";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useInventoryItemCategories } from "@/presentation/inventory/hooks/useInventoryItemCategories";
import InventoryCategoryBrowser from "@/presentation/inventory/components/inventory-category-browser";
import InventoryStockSummary from "@/presentation/inventory/components/inventory-stock-summary";
import InventoryCountsTab from "@/presentation/inventory/components/inventory-counts-tab";
import InventoryPurchasesTab from "@/presentation/inventory/components/inventory-purchases-tab";
import MenuOverviewContent from "@/presentation/menu-management/components/menu-overview-content";
import {
  getInventoryStockStatus,
  isProductStockItem,
  type InventoryItem,
  type InventoryStockStatus,
} from "@/core/inventory/models/inventory-item.model";
import { InventoryItemStockStatusFilter } from "@/presentation/inventory/interfaces/dto/find-all-inventory-items.dto";
import InventoryItemDetailView from "@/presentation/inventory/components/inventory-item-detail-view";
import InventoryCountDetailView from "@/presentation/inventory/components/inventory-count-detail-view";
import InventoryPurchaseDetailView from "@/presentation/inventory/components/inventory-purchase-detail-view";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";

/** "inventory" is the Insumos page. */
type InventoryTab = "menu" | "inventory" | "purchases" | "counts";

/** What the detail pane next to the list shows (tablet). */
type PaneSelection = { kind: "item" | "count" | "purchase"; id: string };

const STATUS_BY_FILTER: Record<
  InventoryItemStockStatusFilter,
  InventoryStockStatus
> = {
  [InventoryItemStockStatusFilter.CRITICAL]: "critical",
  [InventoryItemStockStatusFilter.LOW]: "low",
  [InventoryItemStockStatusFilter.OPTIMAL]: "optimal",
  [InventoryItemStockStatusFilter.NO_MINIMUM]: "noMinimum",
};

const LIST_PANE_WIDTH = 440;

interface InventoryContentProps {
  onBack?: () => void;
}

export default function InventoryContent({ onBack }: InventoryContentProps) {
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
  const [activeTab, setActiveTab] = useState<InventoryTab>("menu");
  // The Menú page's search field opens from the header, like Insumos' search
  const [menuSearchOpen, setMenuSearchOpen] = useState(false);

  // Status chips filter the Insumos in place, like the Menú's stock chips.
  const [statusFilter, setStatusFilter] =
    useState<InventoryItemStockStatusFilter | null>(null);

  // Tablet landscape: details open in a pane next to the list instead of
  // pushing a screen.
  const { isExpanded } = useResponsiveLayout();
  const [selection, setSelection] = useState<PaneSelection | null>(null);
  const activeId = isExpanded ? selection?.id : undefined;

  const changeTab = (tab: InventoryTab) => {
    setActiveTab(tab);
    setSelection(null);
  };

  const openItem = (item: InventoryItem) => {
    if (isExpanded) {
      setSelection({ kind: "item", id: item.id });
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
  const hasBackStep = activeTab === "inventory" && !!statusFilter;
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

  const handleOpenSearch = () => {
    if (activeTab === "menu") {
      setMenuSearchOpen(true);
      return;
    }
    router.push({ pathname: "/(profile)/inventory/search" });
  };

  const handleCreateItem = () => {
    router.push({ pathname: "/(profile)/inventory/items/form" });
  };

  const handleNewCount = () => {
    router.push({ pathname: "/(profile)/inventory/counts/items" });
  };

  const handleRegisterPurchase = () => {
    router.push({ pathname: "/(profile)/inventory/purchases/items" });
  };

  const handleManageCategories = () => {
    router.push({ pathname: "/(profile)/inventory/categories" });
  };

  const handleRefresh = () =>
    Promise.all([catalogQuery.refetch(), categoriesQuery.refetch()]);

  const hasContent = catalogItems.length > 0 || categories.length > 0;

  const tabs: TabItem<InventoryTab>[] = [
    { label: t("tabs.menu"), value: "menu" },
    { label: t("tabs.inventory"), value: "inventory" },
    ...(canManage
      ? [{ label: t("tabs.purchases"), value: "purchases" as const }]
      : []),
    { label: t("tabs.counts"), value: "counts" },
  ];

  const content = (
    <>
      <ThemedView style={tw`px-4 pt-8 gap-4 bg-transparent`}>
        <ThemedView style={tw`items-center gap-6 flex-row bg-transparent`}>
          {onBack && (
            <Pressable
              onPress={onBack}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t("common:actions.goBack")}
              style={({ pressed }) => tw.style(pressed && "opacity-70")}
            >
              <Icon
                name="arrow-left"
                color={tw.color("on-surface")}
                size={24}
              />
            </Pressable>
          )}
          <ThemedText type="h2" style={{ flex: 1 }} numberOfLines={1}>
            {t("title")}
          </ThemedText>
          {(activeTab === "inventory" ||
            (activeTab === "menu" && !menuSearchOpen)) && (
            <Pressable
              onPress={handleOpenSearch}
              hitSlop={13}
              style={({ pressed }) => tw.style(pressed && "opacity-70")}
              accessibilityLabel={
                activeTab === "menu"
                  ? t("menuManagement:products.searchPlaceholder")
                  : t("searchPlaceholder")
              }
              accessibilityRole="button"
            >
              <Icon name="search" color={tw.color("on-surface")} size={22} />
            </Pressable>
          )}
        </ThemedView>
        <TabBar tabs={tabs} activeTab={activeTab} onChange={changeTab} />
      </ThemedView>

      <TabPager
        tabs={tabs}
        activeTab={activeTab}
        onChange={changeTab}
        renderScene={(tab) => (
          <>
            {tab === "inventory" && (
              <ThemedView style={tw`flex-1 px-4 pt-6 gap-6 bg-transparent`}>
                {canManage && (
                  <Button
                    label={t("createItem")}
                    leftIcon="plus"
                    variant="outline"
                    onPress={handleCreateItem}
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
                      {/* Without results the empty state says it and
                          offers the way out */}
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
                    <Icon
                      name="circle-check"
                      size={48}
                      color={tw.color("gray-400")}
                    />
                    <ThemedText
                      type="body1"
                      style={tw`text-center text-gray-500 px-4`}
                    >
                      {t(`filter.empty.${STATUS_BY_FILTER[statusFilter]}`)}
                    </ThemedText>
                    <Button
                      label={t("filter.clear")}
                      variant="outline"
                      onPress={() => setStatusFilter(null)}
                    />
                  </ThemedView>
                ) : !catalogQuery.isLoading &&
                  !catalogQuery.isError &&
                  hasContent ? (
                  <InventoryCategoryBrowser
                    items={filteredItems}
                    hideEmptyGroups={!!statusFilter}
                    categories={categories}
                    onOpenItem={openItem}
                    activeId={activeId}
                    refreshing={catalogQuery.isFetching}
                    onRefresh={handleRefresh}
                    onManageCategories={
                      canManage ? handleManageCategories : undefined
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
                        <Icon
                          name="package"
                          size={48}
                          color={tw.color("gray-400")}
                        />
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
            )}

            {tab === "counts" && (
              <InventoryCountsTab
                onAdd={canManage ? handleNewCount : undefined}
                activeId={activeId}
                onOpenCount={
                  isExpanded
                    ? (count) => setSelection({ kind: "count", id: count.id })
                    : undefined
                }
              />
            )}

            {tab === "purchases" && canManage && (
              <InventoryPurchasesTab
                onAdd={handleRegisterPurchase}
                activeId={activeId}
                onOpenPurchase={
                  isExpanded
                    ? (purchase) =>
                        setSelection({ kind: "purchase", id: purchase.id })
                    : undefined
                }
              />
            )}

            {tab === "menu" && (
              <MenuOverviewContent
                embedded
                active={activeTab === "menu"}
                searchOpen={menuSearchOpen}
                onSearchOpenChange={setMenuSearchOpen}
              />
            )}
          </>
        )}
      />
    </>
  );

  // The menu lays out its own list + product panes.
  if (!isExpanded || activeTab === "menu") return content;

  const closePane = () => setSelection(null);
  const emptyPane = {
    menu: { icon: "hamburger", text: t("pane.selectItem") },
    inventory: { icon: "package", text: t("pane.selectItem") },
    counts: { icon: "clipboard", text: t("pane.selectCount") },
    purchases: { icon: "receipt-text", text: t("pane.selectPurchase") },
  } as const;

  return (
    <ThemedView style={tw`flex-1 flex-row bg-transparent`}>
      <View style={{ width: LIST_PANE_WIDTH }}>{content}</View>
      <ThemedView style={tw`flex-1 border-l border-outline-variant`}>
        {selection?.kind === "item" && (
          <InventoryItemDetailView
            key={selection.id}
            itemId={selection.id}
            embedded
            onClose={closePane}
          />
        )}
        {selection?.kind === "count" && (
          <InventoryCountDetailView
            key={selection.id}
            countId={selection.id}
            embedded
            onClose={closePane}
          />
        )}
        {selection?.kind === "purchase" && (
          <InventoryPurchaseDetailView
            key={selection.id}
            purchaseId={selection.id}
            embedded
            onClose={closePane}
          />
        )}
        {!selection && (
          <ThemedView style={tw`flex-1 items-center justify-center gap-4 px-8`}>
            <Icon
              name={emptyPane[activeTab].icon}
              size={64}
              color={tw.color("gray-400")}
            />
            <ThemedText type="body1" style={tw`text-center text-gray-500`}>
              {emptyPane[activeTab].text}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ThemedView>
  );
}
