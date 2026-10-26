import { useEffect, useMemo, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import Chip from "@/presentation/theme/components/chip";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";
import InventoryItemTile from "@/presentation/inventory/components/inventory-item-tile";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";
import type { InventoryItemCategory } from "@/core/inventory/models/inventory-item-category.model";

const ITEM_MIN_WIDTH = 160;
const ITEM_GAP = 12;
const CATEGORY_COLUMN_WIDTH = 136;
// A group becomes "current" once its header passes this share of the list.
const CATEGORY_SPY_RATIO = 0.3;
// Ignore scroll-spy while a tap-triggered scroll animates to its group.
const CATEGORY_SCROLL_LOCK_MS = 600;

// Key of the "No category" group — category ids are UUIDs, so this never
// collides with a real category.
const UNCATEGORIZED_KEY = "uncategorized";

/** Splits items into rows for the grid. */
const chunk = <T,>(list: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, index) =>
    list.slice(index * size, index * size + size),
  );

interface InventoryCategoryBrowserProps {
  items: InventoryItem[];
  categories: InventoryItemCategory[];
  onOpenItem: (item: InventoryItem) => void;
  /** Highlights the item open in the detail pane (tablet). */
  activeId?: string;
  refreshing: boolean;
  onRefresh: () => void;
  /** Shown at the bottom of the categories column when set. */
  onManageCategories?: () => void;
  /** Drops categories with no items, e.g. while a status filter is on. */
  hideEmptyGroups?: boolean;
}

/**
 * Insumos laid out like the restaurant menu: categories in a column on the
 * left, every item grouped by category on the right. Tapping a category
 * scrolls to its group, and scrolling the items highlights the category on
 * screen.
 */
export default function InventoryCategoryBrowser({
  items,
  categories,
  onOpenItem,
  activeId,
  refreshing,
  onRefresh,
  onManageCategories,
  hideEmptyGroups = false,
}: InventoryCategoryBrowserProps) {
  const { t } = useTranslation("inventory");
  const { gridColumns } = useResponsiveLayout();

  const groups = useMemo(() => {
    const byCategory = new Map<string, InventoryItem[]>();
    for (const item of items) {
      const key = item.category?.id ?? UNCATEGORIZED_KEY;
      const list = byCategory.get(key);
      if (list) list.push(item);
      else byCategory.set(key, [item]);
    }
    // Empty categories stay listed so a new one doesn't seem to vanish.
    const result = categories
      .map((category) => ({
        key: category.id,
        name: category.name,
        items: byCategory.get(category.id) ?? [],
      }))
      .filter((group) => !hideEmptyGroups || group.items.length > 0);
    const uncategorized = byCategory.get(UNCATEGORIZED_KEY);
    if (uncategorized) {
      result.push({
        key: UNCATEGORIZED_KEY,
        name: t("categories.none"),
        items: uncategorized,
      });
    }
    return result;
  }, [items, categories, hideEmptyGroups, t]);

  const [selectedKey, setSelectedKey] = useState("");
  const selected = groups.some((group) => group.key === selectedKey)
    ? selectedKey
    : (groups[0]?.key ?? "");

  // Items flow into as many columns as fit the measured list width
  const [itemsWidth, setItemsWidth] = useState(0);
  const itemColumns = gridColumns(ITEM_MIN_WIDTH, ITEM_GAP, itemsWidth);

  const itemsScrollRef = useRef<ScrollView>(null);
  // Top of each category group inside the items list.
  const groupY = useRef(new Map<string, number>());
  const itemsHeight = useRef(0);
  const isAutoScrolling = useRef(false);
  const autoScrollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(autoScrollTimer.current), []);

  const onSelectCategory = (key: string) => {
    setSelectedKey(key);
    const y = groupY.current.get(key);
    if (y === undefined) return;
    isAutoScrolling.current = true;
    clearTimeout(autoScrollTimer.current);
    autoScrollTimer.current = setTimeout(() => {
      isAutoScrolling.current = false;
    }, CATEGORY_SCROLL_LOCK_MS);
    itemsScrollRef.current?.scrollTo({ y, animated: true });
  };

  // Highlight the category whose group is at the top of the list.
  const onItemsScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isAutoScrolling.current || groups.length === 0) return;
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    // At the very bottom the last group may never reach the line; pick it.
    const atEnd =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 1;
    if (atEnd) {
      setSelectedKey(groups[groups.length - 1].key);
      return;
    }
    const y = contentOffset.y + itemsHeight.current * CATEGORY_SPY_RATIO;
    let current = groups[0].key;
    for (const group of groups) {
      const top = groupY.current.get(group.key);
      if (top !== undefined && top <= y) current = group.key;
    }
    setSelectedKey(current);
  };

  return (
    <ThemedView style={tw`flex-row gap-3 flex-1 bg-transparent`}>
      <ScrollView
        style={{
          width: CATEGORY_COLUMN_WIDTH,
          flexGrow: 0,
          flexShrink: 0,
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-2 pb-8`}
      >
        {groups.map((group) => (
          <Chip
            key={group.key}
            label={group.name}
            selected={selected === group.key}
            onPress={() => onSelectCategory(group.key)}
          />
        ))}
        {onManageCategories && (
          <Chip
            variant="assist"
            label={t("categories.manage")}
            icon="folder-cog"
            onPress={onManageCategories}
          />
        )}
      </ScrollView>
      <ScrollView
        ref={itemsScrollRef}
        style={tw`flex-1`}
        onLayout={(e) => {
          setItemsWidth(e.nativeEvent.layout.width);
          itemsHeight.current = e.nativeEvent.layout.height;
        }}
        onScroll={onItemsScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-6 pb-8`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tw.color("primary")}
            colors={[tw.color("primary") as string]}
          />
        }
      >
        {groups.map((group) => (
          <View
            key={group.key}
            style={tw`gap-3`}
            onLayout={(e) =>
              groupY.current.set(group.key, e.nativeEvent.layout.y)
            }
          >
            <ThemedText type="body1">{group.name}</ThemedText>
            {group.items.length > 0 ? (
              <View style={{ gap: ITEM_GAP }}>
                {chunk(group.items, itemColumns).map((row) => (
                  <View
                    key={row[0].id}
                    style={[tw`flex-row`, { gap: ITEM_GAP }]}
                  >
                    {row.map((item) => (
                      <InventoryItemTile
                        key={item.id}
                        item={item}
                        onPress={onOpenItem}
                        active={activeId === item.id}
                      />
                    ))}
                    {/* Keeps the last row's cards at column width */}
                    {Array.from(
                      { length: itemColumns - row.length },
                      (_, i) => (
                        <View key={i} style={tw`flex-1`} />
                      ),
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <ThemedText type="body2" style={tw`text-gray-500`}>
                {t("categories.emptyFolder")}
              </ThemedText>
            )}
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}
