import { useRef, useState } from "react";
import { ScrollView, RefreshControl, Pressable, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import Button from "@/presentation/theme/components/button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import TextInput from "@/presentation/theme/components/text-input";
import Chip from "@/presentation/theme/components/chip";
import IconButton from "@/presentation/theme/components/icon-button";
import Card from "@/presentation/theme/components/card";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import FloatingToolbar, {
  ToolbarItem,
} from "@/presentation/theme/components/floating-toolbar";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useInventoryItemsBrowser } from "@/presentation/inventory/hooks/useInventoryItemsBrowser";
import { useInventoryItemsSummary } from "@/presentation/inventory/hooks/useInventoryItemsSummary";
import { useInventoryItemCategories } from "@/presentation/inventory/hooks/useInventoryItemCategories";
import AdjustStockModal from "@/presentation/inventory/components/adjust-stock-modal";
import InventoryItemCard from "@/presentation/inventory/components/inventory-item-card";
import InventoryStockSummary from "@/presentation/inventory/components/inventory-stock-summary";
import InventoryCountsTab from "@/presentation/inventory/components/inventory-counts-tab";
import InventoryPurchasesTab from "@/presentation/inventory/components/inventory-purchases-tab";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";
import { InventoryItemStockStatusFilter } from "@/presentation/inventory/interfaces/dto/find-all-inventory-items.dto";

type InventoryTab = "inventory" | "counts" | "purchases";

// Sentinel for the "No category" chip — category ids are UUIDs, so this
// never collides with a real category.
const UNCATEGORIZED_FILTER = "uncategorized";

interface InventoryContentProps {
  onBack?: () => void;
}

export default function InventoryContent({ onBack }: InventoryContentProps) {
  const { t } = useTranslation("inventory");
  const { user } = useAuthStore();
  const canManage = isAdminLevelRole(user?.role?.name);
  const {
    items: catalogItems,
    itemsQuery: catalogQuery,
    deleteItem,
    updateItem,
    bulkDeleteItems,
    bulkMoveItemsToCategory,
  } = useInventoryItems();
  const { categories } = useInventoryItemCategories();
  const menuProducts = useMenuStore((state) => state.products);
  const exampleMenuProductName =
    menuProducts.find((product) => product.isActive)?.name ||
    t("addToInventory.menuProductExampleFallback");
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [itemToAdjust, setItemToAdjust] = useState<InventoryItem | null>(null);
  const [itemForOptions, setItemForOptions] = useState<InventoryItem | null>(
    null,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  // Default to the first category once categories load, rather than in an
  // effect — see https://react.dev/learn/you-might-not-need-an-effect
  // ("Resetting all state when a prop changes"). Only applies once, so it
  // never overrides an explicit "All" selection made afterward.
  const [hasAppliedDefaultCategory, setHasAppliedDefaultCategory] =
    useState(false);
  if (!hasAppliedDefaultCategory && categories.length > 0) {
    setHasAppliedDefaultCategory(true);
    setSelectedCategoryId(categories[0].id);
  }
  const [selectedStatus, setSelectedStatus] =
    useState<InventoryItemStockStatusFilter | null>(null);
  const optionsSheetRef = useRef<BottomSheetMethods>(null);
  const addSheetRef = useRef<BottomSheetMethods>(null);
  const moveCategorySheetRef = useRef<BottomSheetMethods>(null);
  const [activeTab, setActiveTab] = useState<InventoryTab>("inventory");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(),
  );
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const categoryFilter =
    selectedCategoryId && selectedCategoryId !== UNCATEGORIZED_FILTER
      ? selectedCategoryId
      : null;
  const isUncategorizedFilter = selectedCategoryId === UNCATEGORIZED_FILTER;

  const {
    items: browsedItems,
    itemsQuery: browserQuery,
    hasMore,
    isLoadingMore,
    loadMore,
  } = useInventoryItemsBrowser({
    categoryId: categoryFilter,
    uncategorized: isUncategorizedFilter,
    status: selectedStatus,
  });

  // The summary tiles count by status, independent of selectedStatus, so
  // they're fetched separately scoped by category only. Computed by the
  // backend over all matching rows — the browse list above is paginated,
  // so it can't be summed client-side for an accurate total.
  const { counts: summaryCounts } = useInventoryItemsSummary({
    categoryId: categoryFilter,
    uncategorized: isUncategorizedFilter,
  });

  const handleOpenSearch = () => {
    router.push({ pathname: "/(profile)/menu-inventory-search" });
  };

  const handleOpenAddSelector = () => {
    addSheetRef.current?.present();
  };

  const handleCreateItem = () => {
    addSheetRef.current?.dismiss();
    router.push({ pathname: "/(profile)/menu-inventory-item-form" });
  };

  const handleTrackMenuProduct = () => {
    addSheetRef.current?.dismiss();
    router.push({
      pathname: "/(profile)/menu-inventory-item-new-product",
      params: { mode: "track" },
    });
  };

  const handleEditItem = (item: InventoryItem) => {
    router.push({
      pathname: "/(profile)/menu-inventory-item-form",
      params: {
        itemId: item.id,
        name: item.name,
        unit: item.unit,
        quantity: String(item.quantity),
        minimumQuantity:
          item.minimumQuantity != null ? String(item.minimumQuantity) : "",
        isActive: String(item.isActive),
        categoryId: item.category?.id ?? "",
      },
    });
  };

  const handleNewCount = () => {
    addSheetRef.current?.dismiss();
    router.push({ pathname: "/(profile)/menu-inventory-count-items" });
  };

  const handleRegisterPurchase = () => {
    addSheetRef.current?.dismiss();
    router.push({ pathname: "/(profile)/menu-inventory-purchase-items" });
  };

  const handleManageCategories = () => {
    router.push({ pathname: "/(profile)/menu-inventory-categories" });
  };

  const handleCreateCategory = () => {
    router.push({ pathname: "/(profile)/menu-inventory-category-form" });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    await deleteItem.mutateAsync(itemToDelete.id);
    setItemToDelete(null);
  };

  const handleOpenOptions = (item: InventoryItem) => {
    setItemForOptions(item);
    optionsSheetRef.current?.present();
  };

  const handleToggleActive = async (item: InventoryItem) => {
    optionsSheetRef.current?.dismiss();
    await updateItem.mutateAsync({ id: item.id, isActive: !item.isActive });
  };

  const handleReactivate = (item: InventoryItem) => {
    updateItem.mutate({ id: item.id, isActive: true });
  };

  const handleEnterSelectionMode = (item: InventoryItem) => {
    if (isSelectionMode) return;
    setIsSelectionMode(true);
    setSelectedItemIds(new Set([item.id]));
  };

  const handleToggleSelectItem = (item: InventoryItem) => {
    setSelectedItemIds((current) => {
      const next = new Set(current);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  const handleCancelSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedItemIds(new Set());
  };

  const handleOpenMoveCategorySheet = () => {
    moveCategorySheetRef.current?.present();
  };

  const handleConfirmBulkMove = async (categoryId: string | null) => {
    moveCategorySheetRef.current?.dismiss();
    await bulkMoveItemsToCategory.mutateAsync({
      ids: Array.from(selectedItemIds),
      categoryId,
    });
    handleCancelSelectionMode();
  };

  const handleConfirmBulkDelete = async () => {
    await bulkDeleteItems.mutateAsync(Array.from(selectedItemIds));
    setShowBulkDeleteConfirm(false);
    handleCancelSelectionMode();
  };

  const toolbarItems: ToolbarItem[] = [
    {
      icon: "reader-outline",
      onPress: () => setActiveTab("inventory"),
      active: activeTab === "inventory",
      accessibilityLabel: t("title"),
    },
    {
      icon: "clipboard-outline",
      onPress: () => setActiveTab("counts"),
      active: activeTab === "counts",
      accessibilityLabel: t("counts.history"),
    },
    ...(canManage
      ? [
          {
            icon: "receipt-outline" as const,
            onPress: () => setActiveTab("purchases"),
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

  return (
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
              <Ionicons name="arrow-back-outline" size={24} />
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
              <Ionicons name="folder-outline" size={22} />
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
                icon="search-outline"
                editable={false}
                pointerEvents="none"
              />
            </Pressable>

            {(categories.length > 0 || canManage) && (
              <ThemedView
                style={tw`flex-row items-center gap-2 bg-transparent`}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={tw`gap-2 items-center`}
                  style={tw`flex-1`}
                >
                  {/* <Chip */}
                  {/*   label={t("categories.all")} */}
                  {/*   selected={selectedCategoryId === null} */}
                  {/*   onPress={() => setSelectedCategoryId(null)} */}
                  {/* /> */}
                  {categories.map((category) => (
                    <Chip
                      key={category.id}
                      label={category.name}
                      selected={selectedCategoryId === category.id}
                      onPress={() =>
                        setSelectedCategoryId((current) =>
                          current === category.id ? null : category.id,
                        )
                      }
                    />
                  ))}
                  <Chip
                    label={t("categories.none")}
                    selected={selectedCategoryId === UNCATEGORIZED_FILTER}
                    onPress={() =>
                      setSelectedCategoryId((current) =>
                        current === UNCATEGORIZED_FILTER
                          ? null
                          : UNCATEGORIZED_FILTER,
                      )
                    }
                  />

                  {canManage && (
                    <IconButton
                      icon="add"
                      variant="outlined"
                      size={18}
                      onPress={handleCreateCategory}
                      style={tw`p-1.5`}
                    />
                  )}
                </ScrollView>
              </ThemedView>
            )}
          </>
        )}
      </ThemedView>

      {activeTab === "inventory" && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`px-4 gap-6 pb-28 pt-6`}
          refreshControl={
            <RefreshControl
              refreshing={browserQuery.isFetching}
              onRefresh={browserQuery.refetch}
              tintColor={tw.color("blue-500")}
              colors={[tw.color("blue-500") || "#3b82f6"]}
            />
          }
        >
          {browserQuery.isLoading && !isLoadingMore && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <ThemedText type="body1" style={tw`text-gray-500`}>
                {t("loading")}
              </ThemedText>
            </ThemedView>
          )}

          {browserQuery.isError && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <ThemedText type="body1" style={tw`text-red-500`}>
                {t("loadError")}
              </ThemedText>
              <Button
                label={t("retry")}
                onPress={() => browserQuery.refetch()}
                variant="outline"
              />
            </ThemedView>
          )}

          {!browserQuery.isLoading &&
            !browserQuery.isError &&
            catalogItems.length === 0 && (
              <ThemedView style={tw`items-center py-8 gap-3`}>
                <Ionicons name="cube-outline" size={48} color="#999" />
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
                selectedStatus={selectedStatus}
                onSelectStatus={setSelectedStatus}
              />
            )}

          {!browserQuery.isLoading &&
            !browserQuery.isError &&
            catalogItems.length > 0 &&
            browsedItems.length === 0 && (
              <ThemedView style={tw`items-center py-8 gap-3`}>
                <Ionicons name="search-outline" size={40} color="#999" />
                <ThemedText type="body1" style={tw`font-semibold`}>
                  {t("noResults")}
                </ThemedText>
                <ThemedText
                  type="body2"
                  style={tw`text-center text-gray-500 px-4`}
                >
                  {t("noResultsDescription")}
                </ThemedText>
              </ThemedView>
            )}

          {browsedItems.length > 0 && (
            <ThemedView style={tw`gap-3.5 bg-transparent`}>
              {browsedItems.map((item) => (
                <InventoryItemCard
                  key={item.id}
                  item={item}
                  canManage={canManage}
                  onPress={(pressedItem) =>
                    router.push({
                      pathname: "/(profile)/menu-inventory-item-detail",
                      params: { itemId: pressedItem.id },
                    })
                  }
                  onOptionsPress={handleOpenOptions}
                  onAdjustPress={setItemToAdjust}
                  onReactivatePress={handleReactivate}
                  selectionMode={isSelectionMode}
                  selected={selectedItemIds.has(item.id)}
                  onLongPress={handleEnterSelectionMode}
                  onToggleSelect={handleToggleSelectItem}
                />
              ))}
              {hasMore && (
                <Button
                  label={t("common:actions.loadMore")}
                  variant="outline"
                  loading={isLoadingMore}
                  onPress={loadMore}
                />
              )}
            </ThemedView>
          )}
        </ScrollView>
      )}

      {activeTab === "counts" && <InventoryCountsTab />}

      {activeTab === "purchases" && canManage && <InventoryPurchasesTab />}

      <View style={tw`absolute bottom-6 left-0 right-0 items-center`}>
        {isSelectionMode ? (
          <ThemedView
            style={tw`flex-row items-center gap-3 bg-light-surface rounded-full shadow-sm px-3 py-2`}
          >
            <IconButton
              icon="close"
              variant="text"
              onPress={handleCancelSelectionMode}
              accessibilityLabel={t("selection.cancel")}
            />
            <ThemedText
              type="body1"
              style={{ fontFamily: typography.medium }}
            >
              {t("selection.count", { count: selectedItemIds.size })}
            </ThemedText>
            <IconButton
              icon="folder-outline"
              variant="secondary"
              onPress={handleOpenMoveCategorySheet}
              disabled={selectedItemIds.size === 0}
              accessibilityLabel={t("selection.move")}
            />
            <IconButton
              icon="trash-outline"
              variant="destructive"
              onPress={() => setShowBulkDeleteConfirm(true)}
              disabled={selectedItemIds.size === 0}
              accessibilityLabel={t("selection.delete")}
            />
          </ThemedView>
        ) : (
          <ThemedView style={tw`flex-row items-center gap-3 bg-transparent`}>
            <FloatingToolbar items={toolbarItems} />
            {canManage && (
              <IconButton
                icon="add"
                size={40}
                variant="filled"
                onPress={handleOpenAddSelector}
                accessibilityLabel={t("createItem")}
              />
            )}
          </ThemedView>
        )}
      </View>

      <DialogModal
        visible={!!itemToDelete}
        title={t("deleteTitle")}
        message={t("deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deleteItem.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

      <DialogModal
        visible={showBulkDeleteConfirm}
        title={t("selection.deleteTitle")}
        message={t("selection.deleteMessage", {
          count: selectedItemIds.size,
        })}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={bulkDeleteItems.isPending}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />

      <AdjustStockModal
        item={itemToAdjust}
        onClose={() => setItemToAdjust(null)}
      />

      <ThemedBottomSheetModal ref={addSheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6`}>
          <ThemedView style={tw`gap-3 mt-4`}>
            <ThemedText type="caption" style={tw`text-gray-500 font-semibold`}>
              {t("addToInventory.title")}
            </ThemedText>
            <Card onPress={handleTrackMenuProduct}>
              <ThemedView
                style={tw`flex-row items-center gap-3 bg-transparent`}
              >
                <Ionicons
                  name="fast-food-outline"
                  size={26}
                  color={tw.color("text-light-on-surface-variant")}
                />
                <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                  <ThemedText
                    type="body1"
                    style={{ fontFamily: typography.medium }}
                  >
                    {t("addToInventory.menuProduct")}
                  </ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("addToInventory.menuProductDescription", {
                      product: exampleMenuProductName,
                    })}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </Card>

            <Card onPress={handleCreateItem}>
              <ThemedView
                style={tw`flex-row items-center gap-3 bg-transparent`}
              >
                <Ionicons
                  name="cube-outline"
                  size={26}
                  color={tw.color("text-light-on-surface-variant")}
                />
                <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                  <ThemedText
                    type="body1"
                    style={{ fontFamily: typography.medium }}
                  >
                    {t("addToInventory.inventoryItem")}
                  </ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("addToInventory.inventoryItemDescription")}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </Card>
          </ThemedView>

          <ThemedView style={tw`gap-3 mt-6`}>
            <ThemedText type="caption" style={tw`text-gray-500 font-semibold`}>
              {t("inventoryControl")}
            </ThemedText>
            <Card onPress={handleRegisterPurchase}>
              <ThemedView
                style={tw`flex-row items-center gap-3 bg-transparent`}
              >
                <Ionicons
                  name="cart-outline"
                  size={26}
                  color={tw.color("text-light-on-surface-variant")}
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
                <Ionicons
                  name="clipboard-outline"
                  size={26}
                  color={tw.color("text-light-on-surface-variant")}
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

      <ThemedBottomSheetModal ref={optionsSheetRef} enablePanDownToClose>
        {itemForOptions && (
          <ActionsBottomSheet
            title={t("manageItem")}
            subtitle={itemForOptions.name}
            items={[
              {
                icon: "create-outline",
                label: t("editItem"),
                onPress: () => {
                  optionsSheetRef.current?.dismiss();
                  handleEditItem(itemForOptions);
                },
              },
              {
                icon: "power-outline",
                label: itemForOptions.isActive
                  ? t("deactivateItem")
                  : t("activateItem"),
                onPress: () => handleToggleActive(itemForOptions),
              },
              {
                icon: "trash-outline",
                label: t("deleteItem"),
                color: "text-red-600",
                onPress: () => {
                  optionsSheetRef.current?.dismiss();
                  setItemToDelete(itemForOptions);
                },
              },
            ]}
          />
        )}
      </ThemedBottomSheetModal>

      <ThemedBottomSheetModal ref={moveCategorySheetRef} enablePanDownToClose>
        <ActionsBottomSheet
          title={t("selection.moveTitle")}
          subtitle={t("selection.count", { count: selectedItemIds.size })}
          items={[
            ...categories.map((category) => ({
              icon: "folder-outline" as const,
              label: category.name,
              onPress: () => handleConfirmBulkMove(category.id),
            })),
            {
              icon: "folder-open-outline" as const,
              label: t("categories.none"),
              onPress: () => handleConfirmBulkMove(null),
            },
          ]}
        />
      </ThemedBottomSheetModal>
    </>
  );
}
