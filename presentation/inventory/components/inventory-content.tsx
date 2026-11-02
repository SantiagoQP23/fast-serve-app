import { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView } from "react-native";
import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getRelativeDate } from "@/core/i18n/utils";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import {
  canManageInventory,
  isAdminLevelRole,
} from "@/core/auth/models/user.model";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useInventoryCounts } from "@/presentation/inventory/hooks/useInventoryCounts";
import { useInventoryPurchases } from "@/presentation/inventory/hooks/useInventoryPurchases";
import { useModifierGroups } from "@/presentation/menu-management/hooks/useModifierGroups";
import InventoryNavCard from "@/presentation/inventory/components/inventory-nav-card";
import ShoppingListPreview from "@/presentation/inventory/components/shopping-list-preview";
import InventorySplitLayout from "@/presentation/inventory/components/inventory-split-layout";
import InventoryItemDetailView from "@/presentation/inventory/components/inventory-item-detail-view";
import { isProductStockItem } from "@/core/inventory/models/inventory-item.model";
import { InventoryCountStatus } from "@/core/inventory/models/inventory-count.model";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";

interface InventoryContentProps {
  onBack?: () => void;
}

/**
 * The Productos hub: cards that open the Menú, Opciones, Insumos, Conteos
 * and Compras pages (per role), then a glance at the shopping list.
 */
export default function InventoryContent({ onBack }: InventoryContentProps) {
  const { t } = useTranslation("inventory");
  const { user } = useAuthStore();
  const canManage = canManageInventory(user?.role?.name);
  // Groups of options are part of the menu, which only admins edit.
  const canManageMenu = isAdminLevelRole(user?.role?.name);

  const { products: menuProducts, menuQuery } = useMenu();
  const { items: allItems, itemsQuery } = useInventoryItems();
  const { total: countsInProgress, refresh: refreshCounts } =
    useInventoryCounts(InventoryCountStatus.IN_PROGRESS);
  const { purchases, refresh: refreshPurchases } = useInventoryPurchases({
    enabled: canManage,
  });
  const { groups, groupsQuery } = useModifierGroups({
    enabled: canManageMenu,
  });

  const activeProductCount = useMemo(
    () => menuProducts.filter((product) => product.isActive).length,
    [menuProducts],
  );
  // Variant stock shows on its variant (Menú page), not among the insumos.
  const itemCount = useMemo(
    () => allItems.filter((item) => !isProductStockItem(item)).length,
    [allItems],
  );
  const lastPurchase = purchases[0];

  // Tablet landscape: details open in a pane next to the list instead of
  // pushing a screen.
  const { isExpanded } = useResponsiveLayout();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const handleRefresh = () =>
    Promise.all([
      menuQuery.refetch(),
      itemsQuery.refetch(),
      refreshCounts(),
      ...(canManage ? [refreshPurchases()] : []),
      ...(canManageMenu ? [groupsQuery.refetch()] : []),
    ]);

  // Menu things first, then stock; two per row, as many rows as the role sees.
  const cards = [
    <InventoryNavCard
      key="menu"
      icon="hamburger"
      title={t("tabs.menu")}
      subtitle={
        menuQuery.isLoading && menuProducts.length === 0
          ? undefined
          : t("hub.menuCount", { count: activeProductCount })
      }
      onPress={() => router.push({ pathname: "/(profile)/menu/overview" })}
    />,
    ...(canManageMenu
      ? [
          <InventoryNavCard
            key="modifierGroups"
            icon="list-checks"
            title={t("tabs.modifierGroups")}
            subtitle={
              groupsQuery.isLoading
                ? undefined
                : t("hub.groupsCount", { count: groups.length })
            }
            onPress={() =>
              router.push({ pathname: "/(profile)/menu/modifier-groups" })
            }
          />,
        ]
      : []),
    <InventoryNavCard
      key="inventory"
      icon="package"
      title={t("tabs.inventory")}
      subtitle={t("hub.itemsCount", { count: itemCount })}
      onPress={() => router.push({ pathname: "/(profile)/inventory/items" })}
    />,
    <InventoryNavCard
      key="counts"
      icon="clipboard"
      title={t("tabs.counts")}
      subtitle={
        countsInProgress > 0
          ? t("hub.countsInProgress", { count: countsInProgress })
          : t("hub.countsNone")
      }
      onPress={() => router.push({ pathname: "/(profile)/inventory/counts" })}
    />,
    ...(canManage
      ? [
          <InventoryNavCard
            key="purchases"
            icon="receipt-text"
            title={t("tabs.purchases")}
            subtitle={
              lastPurchase
                ? t("hub.lastPurchase", {
                    date: getRelativeDate(lastPurchase.createdAt),
                  })
                : t("hub.noPurchases")
            }
            onPress={() =>
              router.push({ pathname: "/(profile)/inventory/purchases" })
            }
          />,
        ]
      : []),
  ];
  const cardRows = Array.from(
    { length: Math.ceil(cards.length / 2) },
    (_, row) => cards.slice(row * 2, row * 2 + 2),
  );

  const list = (
    <>
      <ThemedView style={tw`px-4 pt-8 bg-transparent`}>
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
        </ThemedView>
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 pt-6 pb-8 gap-8`}
        refreshControl={
          <RefreshControl
            refreshing={itemsQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor={tw.color("primary")}
            colors={[tw.color("primary") as string]}
          />
        }
      >
        <ThemedView style={tw`gap-3 bg-transparent`}>
          {cardRows.map((row, index) => (
            <ThemedView key={index} style={tw`flex-row gap-3 bg-transparent`}>
              {row}
              {row.length === 1 && (
                // Keeps a lone last card at half width
                <ThemedView style={tw`flex-1 bg-transparent`} />
              )}
            </ThemedView>
          ))}
        </ThemedView>

        <ShoppingListPreview
          activeId={isExpanded ? (selectedItemId ?? undefined) : undefined}
          onOpenItem={
            isExpanded ? (item) => setSelectedItemId(item.id) : undefined
          }
        />
      </ScrollView>
    </>
  );

  if (!isExpanded) return list;

  return (
    <InventorySplitLayout
      list={list}
      emptyIcon="clipboard-list"
      emptyText={t("pane.selectItem")}
      pane={
        selectedItemId ? (
          <InventoryItemDetailView
            key={selectedItemId}
            itemId={selectedItemId}
            embedded
            onClose={() => setSelectedItemId(null)}
          />
        ) : null
      }
    />
  );
}
