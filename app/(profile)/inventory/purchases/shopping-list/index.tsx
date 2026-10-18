import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, Share } from "react-native";
import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatDate } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Chip from "@/presentation/theme/components/chip";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import { INVENTORY_STATUS_STYLES } from "@/presentation/inventory/components/inventory-item-card";
import { useShoppingList } from "@/presentation/inventory/hooks/useShoppingList";
import { usePurchaseCartStore } from "@/presentation/inventory/store/purchaseCartStore";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import {
  getInventoryStockStatus,
  getSuggestedPurchaseQuantity,
  type InventoryItem,
} from "@/core/inventory/models/inventory-item.model";

// Stock is stored with 3 decimals; trims float noise like 1.4999999.
const formatQuantity = (quantity: number) => Number(quantity.toFixed(3));

export default function InventoryShoppingListScreen() {
  const { t } = useTranslation("inventory");
  const { lowItems, itemsQuery } = useShoppingList();
  const currentRestaurant = useAuthStore((state) => state.currentRestaurant);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const byId = new Map<string, string>();
    for (const item of lowItems) {
      if (item.category) byId.set(item.category.id, item.category.name);
    }
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [lowItems]);

  const visibleItems = useMemo(
    () =>
      categoryId
        ? lowItems.filter((item) => item.category?.id === categoryId)
        : lowItems,
    [lowItems, categoryId],
  );

  const withUnit = (item: InventoryItem, quantity: number) =>
    t("quantityWithUnit", {
      quantity: formatQuantity(quantity),
      unit: t(`units.${item.unit}`),
    });

  const openItem = (item: InventoryItem) =>
    router.push({
      pathname: "/(profile)/inventory/items/detail",
      params: { itemId: item.id },
    });

  const handleShare = () => {
    const header = [
      t("shoppingList.title"),
      currentRestaurant?.name,
      formatDate(new Date()),
    ]
      .filter(Boolean)
      .join(" · ");
    const lines = visibleItems.map((item) => {
      const suggested = getSuggestedPurchaseQuantity(item);
      return suggested > 0
        ? `- ${item.name}: ${withUnit(item, suggested)}`
        : `- ${item.name}`;
    });
    Share.share({ message: [header, ...lines].join("\n") });
  };

  // Fills the purchase cart with the suggested amounts. Items already in the
  // cart keep what the user typed, and items sitting exactly at their
  // minimum have nothing to suggest, so they're left out.
  const handleStartPurchase = () => {
    const { lines, setLine } = usePurchaseCartStore.getState();
    const inCart = new Set(lines.map((line) => line.item.id));
    for (const item of visibleItems) {
      const suggested = getSuggestedPurchaseQuantity(item);
      if (suggested > 0 && !inCart.has(item.id)) setLine(item, suggested);
    }
    router.push({ pathname: "/(profile)/inventory/purchases/cart" });
  };

  const canStartPurchase = visibleItems.some(
    (item) => getSuggestedPurchaseQuantity(item) > 0,
  );

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ThemedView style={tw`px-4 pt-8 gap-4 bg-transparent`}>
        <InventoryScreenHeader
          title={t("shoppingList.title")}
          right={
            visibleItems.length > 0 ? (
              <IconButton
                icon="share-2"
                onPress={handleShare}
                accessibilityLabel={t("shoppingList.share")}
              />
            ) : undefined
          }
        />

        {categories.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`gap-2 items-center`}
          >
            <Chip
              label={t("categories.all")}
              selected={categoryId === null}
              onPress={() => setCategoryId(null)}
            />
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                selected={categoryId === category.id}
                onPress={() =>
                  setCategoryId((current) =>
                    current === category.id ? null : category.id,
                  )
                }
              />
            ))}
          </ScrollView>
        )}
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 pb-8 pt-4 gap-3`}
        refreshControl={
          <RefreshControl
            refreshing={itemsQuery.isRefetching}
            onRefresh={() => itemsQuery.refetch()}
          />
        }
      >
        {itemsQuery.isLoading && (
          <ThemedText type="body1" style={tw`text-gray-500 text-center py-8`}>
            {t("loading")}
          </ThemedText>
        )}

        {itemsQuery.isError && lowItems.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
            <ThemedText type="body1" style={tw`text-red-500`}>
              {t("loadError")}
            </ThemedText>
            <Button
              label={t("retry")}
              onPress={() => itemsQuery.refetch()}
              variant="outline"
            />
          </ThemedView>
        )}

        {!itemsQuery.isLoading &&
          !itemsQuery.isError &&
          lowItems.length === 0 && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <Icon
                name="circle-check"
                size={48}
                color={tw.color("emerald-500")}
              />
              <ThemedText type="body1" style={tw`font-semibold`}>
                {t("shoppingList.empty")}
              </ThemedText>
              <ThemedText
                type="body2"
                style={tw`text-center text-gray-500 px-4`}
              >
                {t("shoppingList.emptyDescription")}
              </ThemedText>
            </ThemedView>
          )}

        {visibleItems.map((item) => {
          const status = getInventoryStockStatus(item);
          const styles = INVENTORY_STATUS_STYLES[status];
          const suggested = getSuggestedPurchaseQuantity(item);
          return (
            <Card
              key={item.id}
              variant="outline"
              style={tw`p-4 gap-2`}
              onPress={() => openItem(item)}
            >
              <ThemedView
                style={tw`flex-row items-start justify-between gap-3 bg-transparent`}
              >
                <ThemedView style={tw`flex-1 gap-0.5 bg-transparent`}>
                  <ThemedText
                    type="body1"
                    style={[
                      { fontFamily: typography.semibold },
                      tw`text-on-surface`,
                    ]}
                    numberOfLines={2}
                  >
                    {item.name}
                  </ThemedText>
                  {item.category && (
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {item.category.name}
                    </ThemedText>
                  )}
                </ThemedView>
                <Label
                  text={t(`status.${status}`)}
                  color={status === "critical" ? "error" : "warning"}
                  size="small"
                  leftIcon={styles.icon}
                />
              </ThemedView>

              <ThemedText type="body2" style={tw`text-gray-600`}>
                {t("shoppingList.stockAndMinimum", {
                  stock: withUnit(item, item.quantity),
                  minimum: withUnit(item, item.minimumQuantity ?? 0),
                })}
              </ThemedText>

              <ThemedText
                type="body2"
                style={[
                  { fontFamily: typography.semibold },
                  tw`${styles.numberColor ?? "text-on-surface"}`,
                ]}
              >
                {suggested > 0
                  ? t("shoppingList.suggested", {
                      quantity: withUnit(item, suggested),
                    })
                  : t("shoppingList.atMinimum")}
              </ThemedText>
            </Card>
          );
        })}
      </ScrollView>

      {canStartPurchase && (
        <ThemedView style={tw`px-4 pb-2 pt-2 bg-transparent`}>
          <Button
            leftIcon="shopping-cart"
            label={t("shoppingList.startPurchase")}
            onPress={handleStartPurchase}
          />
        </ThemedView>
      )}
    </ScreenLayout>
  );
}
