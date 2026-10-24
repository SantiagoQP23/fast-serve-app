import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import Icon from "@/presentation/theme/components/icon";
import { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import IconButton from "@/presentation/theme/components/icon-button";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useInventoryItemsBrowser } from "@/presentation/inventory/hooks/useInventoryItemsBrowser";
import { useInventoryItemsSummary } from "@/presentation/inventory/hooks/useInventoryItemsSummary";
import { useInventoryItemCategories } from "@/presentation/inventory/hooks/useInventoryItemCategories";
import InventoryItemTile from "@/presentation/inventory/components/inventory-item-tile";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import InventoryStockSummary from "@/presentation/inventory/components/inventory-stock-summary";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";
import { InventoryItemStockStatusFilter } from "@/presentation/inventory/interfaces/dto/find-all-inventory-items.dto";

const SEARCH_DEBOUNCE_MS = 400;

/** Splits items into rows of two for the grid. */
const chunkPairs = <T,>(items: T[]): T[][] =>
  Array.from({ length: Math.ceil(items.length / 2) }, (_, index) =>
    items.slice(index * 2, index * 2 + 2),
  );

interface InventoryItemsViewProps {
  /** Scope to one category. Leave both scope props unset to list every item. */
  categoryId?: string | null;
  /** Scope to items without a category. */
  uncategorized?: boolean;
  title: string;
  /** Stock status the summary cards start filtered by. */
  initialStatus?: InventoryItemStockStatusFilter | null;
  onBack: () => void;
  onOpenItem: (item: InventoryItem) => void;
  /** Highlights the item open in the detail pane (tablet). */
  activeId?: string;
  /** Lets a detail pane next to the list close when its item is deleted. */
  onItemsRemoved?: (ids: string[]) => void;
}

/**
 * Items of one inventory category (or of the whole inventory): stock summary
 * cards that act as status filters, the paginated list, and long-press bulk
 * actions. Used as a pushed screen on phones and inside the list pane on
 * tablets.
 */
export default function InventoryItemsView({
  categoryId,
  uncategorized,
  title,
  initialStatus = null,
  onBack,
  onOpenItem,
  activeId,
  onItemsRemoved,
}: InventoryItemsViewProps) {
  const { t } = useTranslation("inventory");
  const { bulkDeleteItems, bulkMoveItemsToCategory } = useInventoryItems();
  const { categories } = useInventoryItemCategories();
  const [selectedStatus, setSelectedStatus] =
    useState<InventoryItemStockStatusFilter | null>(initialStatus);
  const moveCategorySheetRef = useRef<BottomSheetMethods>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(),
  );
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSearch(search.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timeout);
  }, [search]);

  const {
    items: browsedItems,
    itemsQuery: browserQuery,
    hasMore,
    isLoadingMore,
    loadMore,
  } = useInventoryItemsBrowser({
    categoryId,
    uncategorized,
    status: selectedStatus,
    search: debouncedSearch,
  });

  // The backend returns items ordered by name ASC, so consecutive items
  // sharing a first letter are already adjacent — this just segments that
  // existing order into groups rather than re-sorting.
  const groupedItems = useMemo(() => {
    const groups: { letter: string; items: InventoryItem[] }[] = [];
    for (const item of browsedItems) {
      const letter = item.name.trim().charAt(0).toUpperCase() || "#";
      const lastGroup = groups[groups.length - 1];
      if (lastGroup?.letter === letter) {
        lastGroup.items.push(item);
      } else {
        groups.push({ letter, items: [item] });
      }
    }
    return groups;
  }, [browsedItems]);

  // The summary tiles count by status, independent of selectedStatus, so
  // they're fetched separately scoped by category only. Computed by the
  // backend over all matching rows — the browse list above is paginated,
  // so it can't be summed client-side for an accurate total.
  const { counts: summaryCounts } = useInventoryItemsSummary({
    categoryId,
    uncategorized,
  });

  const isLoaded = !browserQuery.isLoading && !browserQuery.isError;
  // Nothing in this scope at all (as opposed to nothing matching a status
  // or the search)
  const isScopeEmpty =
    isLoaded &&
    !selectedStatus &&
    !debouncedSearch &&
    browsedItems.length === 0;

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

  const handleConfirmBulkMove = async (targetCategoryId: string | null) => {
    moveCategorySheetRef.current?.dismiss();
    await bulkMoveItemsToCategory.mutateAsync({
      ids: Array.from(selectedItemIds),
      categoryId: targetCategoryId,
    });
    handleCancelSelectionMode();
  };

  const handleConfirmBulkDelete = async () => {
    const ids = Array.from(selectedItemIds);
    await bulkDeleteItems.mutateAsync(ids);
    onItemsRemoved?.(ids);
    setShowBulkDeleteConfirm(false);
    handleCancelSelectionMode();
  };

  return (
    <ThemedView style={tw`flex-1 bg-transparent`}>
      <ThemedView style={tw`px-4 pt-8 gap-6 bg-transparent`}>
        <InventoryScreenHeader title={title} onBack={onBack} />
        <TextInput
          placeholder={t("searchPlaceholder")}
          icon="search"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 gap-6 pb-28 pt-6`}
        refreshControl={
          <RefreshControl
            refreshing={browserQuery.isFetching}
            onRefresh={browserQuery.refetch}
            tintColor={tw.color("primary")}
            colors={[tw.color("primary") as string]}
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
            <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
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

        {isScopeEmpty && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="package" size={48} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("categories.emptyFolder")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("categories.emptyFolderDescription")}
            </ThemedText>
          </ThemedView>
        )}

        {!isScopeEmpty && !browserQuery.isError && (
          <InventoryStockSummary
            counts={summaryCounts}
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
          />
        )}

        {isLoaded && !isScopeEmpty && browsedItems.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="search" size={40} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("noResults")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("noResultsDescription")}
            </ThemedText>
          </ThemedView>
        )}

        {browsedItems.length > 0 && (
          <ThemedView style={tw`gap-6 bg-transparent`}>
            {groupedItems.map((group) => (
              <ThemedView key={group.letter} style={tw`gap-3 bg-transparent`}>
                <ThemedText
                  type="caption"
                  style={tw`text-gray-500 font-semibold`}
                >
                  {group.letter}
                </ThemedText>
                {chunkPairs(group.items).map((pair) => (
                  <ThemedView
                    key={pair[0].id}
                    style={tw`flex-row gap-3 bg-transparent`}
                  >
                    {pair.map((item) => (
                      <InventoryItemTile
                        key={item.id}
                        item={item}
                        onPress={
                          isSelectionMode ? handleToggleSelectItem : onOpenItem
                        }
                        onLongPress={handleEnterSelectionMode}
                        selectionMode={isSelectionMode}
                        selected={selectedItemIds.has(item.id)}
                        active={activeId === item.id}
                      />
                    ))}
                    {/* Keeps a lone last card at half width */}
                    {pair.length === 1 && <ThemedView style={tw`flex-1`} />}
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
          </ThemedView>
        )}
      </ScrollView>

      {isSelectionMode && (
        <ThemedView
          style={tw`absolute bottom-6 left-0 right-0 items-center bg-transparent`}
        >
          <ThemedView
            style={tw`flex-row items-center gap-3 bg-surface rounded-full shadow-sm px-3 py-2`}
          >
            <IconButton
              icon="x"
              variant="text"
              onPress={handleCancelSelectionMode}
              accessibilityLabel={t("selection.cancel")}
            />
            <ThemedText type="body1" style={{ fontFamily: typography.medium }}>
              {t("selection.count", { count: selectedItemIds.size })}
            </ThemedText>
            <IconButton
              icon="folder"
              variant="surface"
              onPress={handleOpenMoveCategorySheet}
              disabled={selectedItemIds.size === 0}
              accessibilityLabel={t("selection.move")}
            />
            <IconButton
              icon="trash"
              variant="destructive"
              onPress={() => setShowBulkDeleteConfirm(true)}
              disabled={selectedItemIds.size === 0}
              accessibilityLabel={t("selection.delete")}
            />
          </ThemedView>
        </ThemedView>
      )}

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

      <ThemedBottomSheetModal ref={moveCategorySheetRef} enablePanDownToClose>
        <ActionsBottomSheet
          title={t("selection.moveTitle")}
          subtitle={t("selection.count", { count: selectedItemIds.size })}
          items={[
            ...categories.map((category) => ({
              icon: "folder" as const,
              label: category.name,
              onPress: () => handleConfirmBulkMove(category.id),
            })),
            {
              icon: "folder-open" as const,
              label: t("categories.none"),
              onPress: () => handleConfirmBulkMove(null),
            },
          ]}
        />
      </ThemedBottomSheetModal>
    </ThemedView>
  );
}
