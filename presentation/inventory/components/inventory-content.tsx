import { useMemo, useRef, useState } from "react";
import {
  ScrollView,
  RefreshControl,
  Pressable,
  View,
} from "react-native";
import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import {
  BottomSheetMethods,
  BottomSheetView,
} from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { canManageInventory } from "@/core/auth/models/user.model";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import IconButton from "@/presentation/theme/components/icon-button";
import Card from "@/presentation/theme/components/card";
import FloatingToolbar, {
  ToolbarItem,
} from "@/presentation/theme/components/floating-toolbar";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useInventoryItemsSummary } from "@/presentation/inventory/hooks/useInventoryItemsSummary";
import { useInventoryItemCategories } from "@/presentation/inventory/hooks/useInventoryItemCategories";
import AddToInventoryOptions from "@/presentation/inventory/components/add-to-inventory-options";
import InventoryCategoryFolder, {
  NewCategoryFolder,
  type InventoryFolderHealth,
} from "@/presentation/inventory/components/inventory-category-folder";
import InventoryItemsView from "@/presentation/inventory/components/inventory-items-view";
import InventoryStockSummary from "@/presentation/inventory/components/inventory-stock-summary";
import InventoryCountsTab from "@/presentation/inventory/components/inventory-counts-tab";
import InventoryPurchasesTab from "@/presentation/inventory/components/inventory-purchases-tab";
import {
  getInventoryStockStatus,
  type InventoryItem,
} from "@/core/inventory/models/inventory-item.model";
import { InventoryItemStockStatusFilter } from "@/presentation/inventory/interfaces/dto/find-all-inventory-items.dto";
import InventoryItemDetailView from "@/presentation/inventory/components/inventory-item-detail-view";
import InventoryCountDetailView from "@/presentation/inventory/components/inventory-count-detail-view";
import InventoryPurchaseDetailView from "@/presentation/inventory/components/inventory-purchase-detail-view";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";

type InventoryTab = "inventory" | "counts" | "purchases";

/** What the detail pane next to the list shows (tablet). */
type PaneSelection = { kind: "item" | "count" | "purchase"; id: string };

/** What a folder (or summary card) opens: a slice of the item list. */
interface ItemsScope {
  categoryId: string | null;
  uncategorized: boolean;
  title: string;
  status: InventoryItemStockStatusFilter | null;
}

const LIST_PANE_WIDTH = 440;
const FOLDER_MIN_WIDTH = 150;
const FOLDER_GAP = 12;

// Key of the "No category" bucket in the folder stats — category ids are
// UUIDs, so this never collides with a real category.
const UNCATEGORIZED_KEY = "uncategorized";

interface InventoryContentProps {
  onBack?: () => void;
}

export default function InventoryContent({ onBack }: InventoryContentProps) {
  const { t } = useTranslation("inventory");
  const { user } = useAuthStore();
  const canManage = canManageInventory(user?.role?.name);
  const { items: catalogItems, itemsQuery: catalogQuery } = useInventoryItems();
  const { categories, categoriesQuery } = useInventoryItemCategories();
  const addSheetRef = useRef<BottomSheetMethods>(null);
  const [activeTab, setActiveTab] = useState<InventoryTab>("inventory");

  // Tablet landscape: details open in a pane next to the list instead of
  // pushing a screen, and folders open in place of the folder grid.
  const { isExpanded, gridColumns } = useResponsiveLayout();
  const [selection, setSelection] = useState<PaneSelection | null>(null);
  const [folderView, setFolderView] = useState<ItemsScope | null>(null);
  const [gridWidth, setGridWidth] = useState(0);
  const activeId = isExpanded ? selection?.id : undefined;

  const changeTab = (tab: InventoryTab) => {
    setActiveTab(tab);
    setSelection(null);
    setFolderView(null);
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

  // Global stock counts for the summary cards: they open the item list
  // already filtered by that status, rather than filtering this screen.
  const { summaryQuery, counts: summaryCounts } = useInventoryItemsSummary();

  // The backend has no per-category count, so folders are tallied from the
  // full catalog (already loaded for pickers).
  const folderStats = useMemo(() => {
    const stats = new Map<
      string,
      { count: number; health: InventoryFolderHealth }
    >();
    for (const item of catalogItems) {
      const key = item.category?.id ?? UNCATEGORIZED_KEY;
      const entry = stats.get(key) ?? { count: 0, health: null };
      entry.count += 1;
      const status = getInventoryStockStatus(item);
      if (status === "critical") {
        entry.health = "critical";
      } else if (status === "low" && entry.health !== "critical") {
        entry.health = "low";
      }
      stats.set(key, entry);
    }
    return stats;
  }, [catalogItems]);

  const openItems = (scope: ItemsScope) => {
    if (isExpanded) {
      setFolderView(scope);
      return;
    }
    router.push({
      pathname: "/(profile)/inventory/items/list",
      params: {
        ...(scope.categoryId
          ? { categoryId: scope.categoryId, name: scope.title }
          : {}),
        ...(scope.uncategorized ? { uncategorized: "true" } : {}),
        ...(scope.status ? { status: scope.status } : {}),
      },
    });
  };

  const handleOpenSearch = () => {
    router.push({ pathname: "/(profile)/inventory/search" });
  };

  const handleOpenAddSelector = () => {
    if (activeTab === "counts") {
      handleNewCount();
      return;
    }
    if (activeTab === "purchases") {
      handleRegisterPurchase();
      return;
    }
    addSheetRef.current?.present();
  };

  const handleCreateItem = () => {
    addSheetRef.current?.dismiss();
    router.push({ pathname: "/(profile)/inventory/items/form" });
  };

  const handleTrackMenuProduct = () => {
    addSheetRef.current?.dismiss();
    router.push({
      pathname: "/(profile)/inventory/items/new-product",
      params: { mode: "track" },
    });
  };

  const handleNewCount = () => {
    addSheetRef.current?.dismiss();
    router.push({ pathname: "/(profile)/inventory/counts/items" });
  };

  const handleRegisterPurchase = () => {
    addSheetRef.current?.dismiss();
    router.push({ pathname: "/(profile)/inventory/purchases/items" });
  };

  const handleManageCategories = () => {
    router.push({ pathname: "/(profile)/inventory/categories" });
  };

  const handleCreateCategory = () => {
    router.push({ pathname: "/(profile)/inventory/categories/form" });
  };

  const handleRefresh = () =>
    Promise.all([
      catalogQuery.refetch(),
      categoriesQuery.refetch(),
      summaryQuery.refetch(),
    ]);

  const handleItemsRemoved = (ids: string[]) => {
    if (selection && ids.includes(selection.id)) setSelection(null);
  };

  const folderColumns = Math.max(
    2,
    gridColumns(FOLDER_MIN_WIDTH, FOLDER_GAP, gridWidth),
  );
  const folderWidth =
    gridWidth > 0
      ? (gridWidth - FOLDER_GAP * (folderColumns - 1)) / folderColumns
      : undefined;
  const uncategorizedStats = folderStats.get(UNCATEGORIZED_KEY);
  const hasContent = catalogItems.length > 0 || categories.length > 0;

  const toolbarItems: ToolbarItem[] = [
    {
      icon: "book-open-text",
      label: t("tabs.inventory"),
      onPress: () => changeTab("inventory"),
      active: activeTab === "inventory",
      accessibilityLabel: t("title"),
    },
    {
      icon: "clipboard",
      label: t("tabs.counts"),
      onPress: () => changeTab("counts"),
      active: activeTab === "counts",
      accessibilityLabel: t("counts.history"),
    },
    ...(canManage
      ? [
          {
            icon: "receipt-text" as const,
            label: t("tabs.purchases"),
            onPress: () => changeTab("purchases"),
            active: activeTab === "purchases",
            accessibilityLabel: t("purchases.history"),
          },
        ]
      : []),
  ];

  const screenTitle =
    activeTab === "counts"
      ? t("counts.title")
      : activeTab === "purchases"
        ? t("purchases.title")
        : t("title");

  const content = (
    <>
      <ThemedView style={tw`px-4 pt-8 gap-4 bg-transparent`}>
        <ThemedView style={tw`items-center gap-3 flex-row bg-transparent`}>
          {onBack && (
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel={t("common:actions.goBack")}
              style={({ pressed }) => tw.style(pressed && "opacity-70")}
            >
              <Icon name="arrow-left" color={tw.color("on-surface")} size={24} />
            </Pressable>
          )}
          <ThemedText
            type="h3"
            style={{ fontFamily: typography.medium, flex: 1 }}
            numberOfLines={1}
          >
            {screenTitle}
          </ThemedText>
          {canManage && activeTab === "inventory" && (
            <Pressable
              onPress={handleManageCategories}
              style={({ pressed }) => tw.style(pressed && "opacity-70")}
              accessibilityLabel={t("categories.title")}
              accessibilityRole="button"
            >
              <Icon name="folder" color={tw.color("on-surface")} size={22} />
            </Pressable>
          )}
        </ThemedView>

        {activeTab === "inventory" && (
          <>
            <Pressable
              onPress={handleOpenSearch}
              accessibilityRole="button"
              accessibilityLabel={t("searchPlaceholder")}
            >
              <TextInput
                placeholder={t("searchPlaceholder")}
                icon="search"
                editable={false}
                pointerEvents="none"
              />
            </Pressable>
          </>
        )}
      </ThemedView>

      {activeTab === "inventory" && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`px-4 gap-6 pb-28 pt-6`}
          refreshControl={
            <RefreshControl
              refreshing={catalogQuery.isFetching}
              onRefresh={handleRefresh}
              tintColor={tw.color("blue-500")}
              colors={[tw.color("blue-500") || "#3b82f6"]}
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
              <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
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

          {!catalogQuery.isLoading && !catalogQuery.isError && !hasContent && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <Icon name="package" size={48} color={tw.color("gray-400")} />
              <ThemedText type="body1" style={tw`font-semibold`}>
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

          {!catalogQuery.isLoading &&
            !catalogQuery.isError &&
            catalogItems.length > 0 && (
              <InventoryStockSummary
                counts={summaryCounts}
                selectedStatus={null}
                onSelectStatus={(status) =>
                  status &&
                  openItems({
                    categoryId: null,
                    uncategorized: false,
                    title: t("allItems"),
                    status,
                  })
                }
              />
            )}

          {!catalogQuery.isLoading && !catalogQuery.isError && hasContent && (
            <ThemedView style={tw`gap-3 bg-transparent`}>
              <ThemedText
                type="caption"
                style={tw`text-gray-500 font-semibold`}
              >
                {t("categories.title")}
              </ThemedText>
              <View
                style={[
                  tw`flex-row flex-wrap`,
                  { gap: FOLDER_GAP },
                ]}
                onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
              >
                {folderWidth !== undefined && (
                  <>
                    {categories.map((category) => (
                      <View key={category.id} style={{ width: folderWidth }}>
                        <InventoryCategoryFolder
                          name={category.name}
                          itemCount={folderStats.get(category.id)?.count ?? 0}
                          health={folderStats.get(category.id)?.health}
                          onPress={() =>
                            openItems({
                              categoryId: category.id,
                              uncategorized: false,
                              title: category.name,
                              status: null,
                            })
                          }
                        />
                      </View>
                    ))}
                    {uncategorizedStats && (
                      <View style={{ width: folderWidth }}>
                        <InventoryCategoryFolder
                          name={t("categories.none")}
                          itemCount={uncategorizedStats.count}
                          health={uncategorizedStats.health}
                          isUncategorized
                          onPress={() =>
                            openItems({
                              categoryId: null,
                              uncategorized: true,
                              title: t("categories.none"),
                              status: null,
                            })
                          }
                        />
                      </View>
                    )}
                    {canManage && (
                      <View style={{ width: folderWidth }}>
                        <NewCategoryFolder onPress={handleCreateCategory} />
                      </View>
                    )}
                  </>
                )}
              </View>
            </ThemedView>
          )}
        </ScrollView>
      )}

      {activeTab === "counts" && (
        <InventoryCountsTab
          activeId={activeId}
          onOpenCount={
            isExpanded
              ? (count) => setSelection({ kind: "count", id: count.id })
              : undefined
          }
        />
      )}

      {activeTab === "purchases" && canManage && (
        <InventoryPurchasesTab
          activeId={activeId}
          onOpenPurchase={
            isExpanded
              ? (purchase) =>
                  setSelection({ kind: "purchase", id: purchase.id })
              : undefined
          }
        />
      )}

      <View style={tw`absolute bottom-6 left-0 right-0 items-center`}>
        <ThemedView style={tw`flex-row items-center gap-3 bg-transparent`}>
          <FloatingToolbar items={toolbarItems} />
          {canManage && (
            <IconButton
              icon="plus"
              size={40}
              variant="filled"
              onPress={handleOpenAddSelector}
              accessibilityLabel={
                activeTab === "counts"
                  ? t("counts.new")
                  : activeTab === "purchases"
                    ? t("purchases.register")
                    : t("createItem")
              }
            />
          )}
        </ThemedView>
      </View>

      <ThemedBottomSheetModal ref={addSheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6`}>
          <AddToInventoryOptions
            onTrackMenuProduct={handleTrackMenuProduct}
            onCreateItem={handleCreateItem}
          />

          <ThemedView style={tw`gap-3 mt-6`}>
            <ThemedText type="caption" style={tw`text-gray-500 font-semibold`}>
              {t("inventoryControl")}
            </ThemedText>
            <Card onPress={handleRegisterPurchase}>
              <ThemedView
                style={tw`flex-row items-center gap-3 bg-transparent`}
              >
                <Icon
                  name="shopping-cart"
                  size={26}
                  color={tw.color("text-on-surface-variant")}
                />
                <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                  <ThemedText
                    type="body1"
                    style={{ fontFamily: typography.medium }}
                  >
                    {t("purchases.register")}
                  </ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("purchases.registerDescription")}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </Card>

            <Card onPress={handleNewCount}>
              <ThemedView
                style={tw`flex-row items-center gap-3 bg-transparent`}
              >
                <Icon
                  name="clipboard"
                  size={26}
                  color={tw.color("text-on-surface-variant")}
                />
                <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                  <ThemedText
                    type="body1"
                    style={{ fontFamily: typography.medium }}
                  >
                    {t("counts.new")}
                  </ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("counts.newDescription")}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </Card>
          </ThemedView>
        </BottomSheetView>
      </ThemedBottomSheetModal>
    </>
  );

  if (!isExpanded) return content;

  const listPane = folderView ? (
    <InventoryItemsView
      key={`${folderView.categoryId}-${folderView.uncategorized}-${folderView.status}`}
      categoryId={folderView.categoryId}
      uncategorized={folderView.uncategorized}
      title={folderView.title}
      initialStatus={folderView.status}
      onBack={() => setFolderView(null)}
      onOpenItem={openItem}
      activeId={activeId}
      onItemsRemoved={handleItemsRemoved}
    />
  ) : (
    content
  );

  const closePane = () => setSelection(null);
  const emptyPane = {
    inventory: { icon: "package", text: t("pane.selectItem") },
    counts: { icon: "clipboard", text: t("pane.selectCount") },
    purchases: { icon: "receipt-text", text: t("pane.selectPurchase") },
  } as const;

  return (
    <ThemedView style={tw`flex-1 flex-row bg-transparent`}>
      <View style={{ width: LIST_PANE_WIDTH }}>{listPane}</View>
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
