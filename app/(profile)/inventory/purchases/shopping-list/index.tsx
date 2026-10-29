import { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Share } from "react-native";
import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatDate } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import Button from "@/presentation/theme/components/button";
import Chip from "@/presentation/theme/components/chip";
import DetailHeader from "@/presentation/theme/components/detail-header";
import {
  DetailCard,
  DetailCardTitle,
} from "@/presentation/theme/components/detail-card";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import { useShoppingList } from "@/presentation/inventory/hooks/useShoppingList";
import { usePurchaseCartStore } from "@/presentation/inventory/store/purchaseCartStore";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import {
  getSuggestedPurchaseQuantity,
  type InventoryItem,
} from "@/core/inventory/models/inventory-item.model";

// Stock is stored with 3 decimals; trims float noise like 1.4999999.
const formatQuantity = (quantity: number) => Number(quantity.toFixed(3));

export default function InventoryShoppingListScreen() {
  const { t } = useTranslation("inventory");
  const { lowItems, outWithoutMinimum, itemsQuery } = useShoppingList();
  const currentRestaurant = useAuthStore((state) => state.currentRestaurant);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const primaryColor = useThemeColor({}, "primary");

  const categories = useMemo(() => {
    const byId = new Map<string, string>();
    for (const item of [...lowItems, ...outWithoutMinimum]) {
      if (item.category) byId.set(item.category.id, item.category.name);
    }
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [lowItems, outWithoutMinimum]);

  const inCategory = (item: InventoryItem) =>
    !categoryId || item.category?.id === categoryId;
  const visibleItems = lowItems.filter(inCategory);
  const visibleOutWithoutMinimum = outWithoutMinimum.filter(inCategory);
  const isEmpty = lowItems.length === 0 && outWithoutMinimum.length === 0;

  const subtitle = itemsQuery.isLoading
    ? t("loading")
    : lowItems.length > 0
      ? t("shoppingList.lowCount", { count: lowItems.length })
      : t("shoppingList.allGood");

  const withUnit = (item: InventoryItem, quantity: number) =>
    t("quantityWithUnit", {
      quantity: formatQuantity(quantity),
      unit: t(`units.${item.unit}`, { count: quantity }),
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
    const lines = visibleItems.map(
      (item) =>
        `- ${item.name}: ${withUnit(item, getSuggestedPurchaseQuantity(item))}`,
    );
    Share.share({ message: [header, ...lines].join("\n") });
  };

  // Fills the purchase cart with the suggested amounts. Items already in the
  // cart keep what the user typed.
  const handleStartPurchase = () => {
    const { lines, setLine } = usePurchaseCartStore.getState();
    const inCart = new Set(lines.map((line) => line.item.id));
    for (const item of visibleItems) {
      if (!inCart.has(item.id)) {
        setLine(item, getSuggestedPurchaseQuantity(item));
      }
    }
    router.push({ pathname: "/(profile)/inventory/purchases/cart" });
  };

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ThemedView style={tw`px-4 pt-8 bg-transparent`}>
        <InventoryScreenHeader />
      </ThemedView>

      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 pt-6 pb-10 gap-4`}
        refreshControl={
          <RefreshControl
            refreshing={itemsQuery.isRefetching}
            onRefresh={() => itemsQuery.refetch()}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
      >
        <DetailHeader
          title={t("shoppingList.title")}
          subtitle={subtitle}
          icon="clipboard-list"
        >
          {visibleItems.length > 0 && (
            <ThemedView style={tw`flex-row flex-wrap gap-3`}>
              <Button
                label={t("purchases.register")}
                leftIcon="shopping-cart"
                shape="rounded"
                size="small"
                accessibilityLabel={t("shoppingList.startPurchase")}
                onPress={handleStartPurchase}
              />
              <Button
                label={t("common:actions.share")}
                leftIcon="share-2"
                variant="surface"
                shape="rounded"
                size="small"
                accessibilityLabel={t("shoppingList.share")}
                onPress={handleShare}
              />
            </ThemedView>
          )}
        </DetailHeader>

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

        {itemsQuery.isLoading && (
          <ThemedText type="body1" style={tw`text-gray-500 text-center py-8`}>
            {t("loading")}
          </ThemedText>
        )}

        {itemsQuery.isError && isEmpty && (
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

        {!itemsQuery.isLoading && !itemsQuery.isError && isEmpty && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon
              name="circle-check"
              size={48}
              color={tw.color("emerald-500")}
            />
            <ThemedText type="body1" style={{ fontFamily: typography.bold }}>
              {t("shoppingList.empty")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("shoppingList.emptyDescription")}
            </ThemedText>
          </ThemedView>
        )}

        {/* What to buy and how much, like the bill's products card */}
        {visibleItems.length > 0 && (
          <DetailCard style={tw`py-5 gap-4`}>
            <DetailCardTitle title={t("shoppingList.toBuyTitle")} />
            {visibleItems.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => openItem(item)}
                accessibilityRole="button"
                style={({ pressed }) =>
                  tw.style("flex-row items-center gap-4", pressed && "opacity-70")
                }
              >
                <ThemedView style={tw`flex-1 gap-0.5 bg-transparent`}>
                  <ThemedText numberOfLines={2}>{item.name}</ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("shoppingList.stockAndMinimum", {
                      stock: withUnit(item, item.quantity),
                      minimum: withUnit(item, item.minimumQuantity ?? 0),
                    })}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={tw`items-end gap-0.5 bg-transparent`}>
                  <ThemedText>
                    {withUnit(item, getSuggestedPurchaseQuantity(item))}
                  </ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("shoppingList.toBuy")}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </DetailCard>
        )}

        {visibleOutWithoutMinimum.length > 0 && (
          <DetailCard style={tw`py-5 gap-4`}>
            <ThemedView style={tw`gap-1 bg-transparent`}>
              <DetailCardTitle title={t("shoppingList.outWithoutMinimum")} />
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("shoppingList.outWithoutMinimumHint")}
              </ThemedText>
            </ThemedView>
            {visibleOutWithoutMinimum.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => openItem(item)}
                accessibilityRole="button"
                style={({ pressed }) =>
                  tw.style("flex-row items-center gap-4", pressed && "opacity-70")
                }
              >
                <ThemedView style={tw`flex-1 gap-0.5 bg-transparent`}>
                  <ThemedText numberOfLines={2}>{item.name}</ThemedText>
                  <ThemedText type="small" style={tw`text-red-600`}>
                    {t("shoppingList.remaining", {
                      stock: withUnit(item, item.quantity),
                    })}
                  </ThemedText>
                </ThemedView>
                <Icon
                  name="chevron-right"
                  size={20}
                  color={tw.color("gray-400")}
                />
              </Pressable>
            ))}
          </DetailCard>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}
