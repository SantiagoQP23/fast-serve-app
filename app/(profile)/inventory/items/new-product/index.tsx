import { useEffect, useMemo, useState } from "react";
import { ScrollView, RefreshControl, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import TextInput from "@/presentation/theme/components/text-input";
import Chip from "@/presentation/theme/components/chip";
import Button from "@/presentation/theme/components/button";
import LinkProductRow from "@/presentation/inventory/components/link-product-row";
import { useInventoryItemDetail } from "@/presentation/inventory/hooks/useInventoryItemDetail";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useProductSearch } from "@/presentation/restaurant-menu/hooks/useProductSearch";

export default function NewInventoryItemSelectProductScreen() {
  const { t } = useTranslation("inventory");
  const params = useLocalSearchParams<{
    inventoryItemId?: string;
    itemName?: string;
    unit?: string;
  }>();
  const {
    categories: allCategories,
    products: allProducts,
    menuQuery,
  } = useMenu();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Picks the variants whose recipe will use this insumo.
  const { item } = useInventoryItemDetail(params.inventoryItemId ?? "");
  const linkedIds = useMemo(
    () =>
      new Set((item?.productOptions ?? []).map((line) => line.productOptionId)),
    [item],
  );
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const categories = useMemo(
    () => allCategories.filter((c) => c.isActive),
    [allCategories],
  );
  const products = useMemo(
    () => allProducts.filter((p) => p.isActive),
    [allProducts],
  );

  useEffect(() => {
    if (products.length === 0) {
      setIsLoadingMenu(true);
      menuQuery.refetch().finally(() => setIsLoadingMenu(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await menuQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const categoryProducts = useMemo(
    () =>
      categoryId
        ? products.filter((product) => product.category.id === categoryId)
        : products,
    [products, categoryId],
  );
  const filteredProducts = useProductSearch(categoryProducts, search);

  const handleToggleOptions = (optionIds: number[], selected: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const id of optionIds) {
        if (linkedIds.has(id)) continue;
        if (selected) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const handleToggleExpanded = (productId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleContinue = () => {
    router.push({
      pathname: "/(profile)/inventory/items/new-quantity",
      params: {
        optionIds: Array.from(selectedIds).join(","),
        inventoryItemId: params.inventoryItemId ?? "",
        itemName: params.itemName ?? "",
        unit: params.unit ?? "",
      },
    });
  };

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
      <ThemedView style={tw`items-center gap-4 flex-row mb-6`}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t("common:actions.goBack")}
          style={({ pressed }) => tw.style(pressed && "opacity-70")}
        >
          <Icon name="arrow-left" color={tw.color("on-surface")} size={24} />
        </Pressable>
        <ThemedText
          type="h3"
          style={{ fontFamily: typography.regular }}
          numberOfLines={1}
        >
          {t("linkedItem.selectProductsTitle")}
        </ThemedText>
      </ThemedView>

      <ThemedView style={tw`gap-4 flex-1`}>
        <TextInput
          placeholder={t("linkedItem.searchProductsPlaceholder")}
          icon="search"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />

        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`gap-2 items-center`}
            style={tw`flex-none`}
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

        <ScrollView
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-3 pb-8`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tw.color("primary")}
              colors={[tw.color("primary") as string]}
            />
          }
        >
          {isLoadingMenu && products.length === 0 && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <ThemedText type="body1" style={tw`text-gray-500`}>
                {t("loading")}
              </ThemedText>
            </ThemedView>
          )}

          {!isLoadingMenu && menuQuery.isError && products.length === 0 && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
              <ThemedText type="body1" style={tw`text-red-500`}>
                {t("loadError")}
              </ThemedText>
              <Button
                label={t("retry")}
                onPress={() => menuQuery.refetch()}
                variant="outline"
              />
            </ThemedView>
          )}

          {!isLoadingMenu && !menuQuery.isError && products.length === 0 && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <Icon name="hamburger" size={48} color={tw.color("gray-400")} />
              <ThemedText type="body1" style={tw`font-semibold`}>
                {t("linkedItem.noProducts")}
              </ThemedText>
              <ThemedText
                type="body2"
                style={tw`text-center text-gray-500 px-4`}
              >
                {t("linkedItem.noProductsDescription")}
              </ThemedText>
            </ThemedView>
          )}

          {products.length > 0 && filteredProducts.length === 0 && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <Icon name="search" size={40} color={tw.color("gray-400")} />
              <ThemedText type="body1" style={tw`font-semibold`}>
                {t("noResults")}
              </ThemedText>
            </ThemedView>
          )}

          {filteredProducts.map((product) => (
            <LinkProductRow
              key={product.id}
              product={product}
              options={product.options.filter((option) => option.isActive)}
              selectedIds={selectedIds}
              linkedIds={linkedIds}
              expanded={expandedIds.has(product.id)}
              onToggleExpanded={() => handleToggleExpanded(product.id)}
              onToggleOptions={handleToggleOptions}
            />
          ))}
        </ScrollView>

        {selectedIds.size > 0 && (
          <ThemedView style={tw`pt-2 pb-6`}>
            <Button
              label={t("linkedItem.continueCount", { count: selectedIds.size })}
              rightIcon="arrow-right"
              onPress={handleContinue}
            />
          </ThemedView>
        )}
      </ThemedView>
    </ScreenLayout>
  );
}
