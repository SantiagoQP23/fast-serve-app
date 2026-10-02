import { useEffect, useMemo, useState } from "react";
import { ScrollView, RefreshControl, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import TextInput from "@/presentation/theme/components/text-input";
import Chip from "@/presentation/theme/components/chip";
import Button from "@/presentation/theme/components/button";
import ProductCard from "@/presentation/restaurant-menu/product-card";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import type { Product } from "@/core/menu/models/product.model";

export default function NewInventoryItemSelectProductScreen() {
  const { t } = useTranslation("inventory");
  const { categories: allCategories, products: allProducts, menuQuery } =
    useMenu();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        !query || product.name.toLowerCase().includes(query);
      const matchesCategory = !categoryId || product.category.id === categoryId;
      return matchesQuery && matchesCategory;
    });
  }, [products, search, categoryId]);

  const handleSelectProduct = (product: Product) => {
    router.push({
      pathname: "/(profile)/menu-inventory-item-new-option",
      params: { productId: product.id, productName: product.name },
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
          <Ionicons name="arrow-back-outline" size={24} />
        </Pressable>
        <ThemedText
          type="h3"
          style={{ fontFamily: typography.regular }}
          numberOfLines={1}
        >
          {t("linkedItem.selectProductTitle")}
        </ThemedText>
      </ThemedView>

      <ThemedView style={tw`gap-4 flex-1`}>
        <TextInput
          placeholder={t("linkedItem.searchProductsPlaceholder")}
          icon="search-outline"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />

        {categories.length > 0 && (
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-3 pb-8`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tw.color("blue-500")}
              colors={[tw.color("blue-500") || "#3b82f6"]}
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
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
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

          {!isLoadingMenu &&
            !menuQuery.isError &&
            products.length === 0 && (
              <ThemedView style={tw`items-center py-8 gap-3`}>
                <Ionicons name="fast-food-outline" size={48} color="#999" />
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
              <Ionicons name="search-outline" size={40} color="#999" />
              <ThemedText type="body1" style={tw`font-semibold`}>
                {t("noResults")}
              </ThemedText>
            </ThemedView>
          )}

          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => handleSelectProduct(product)}
            />
          ))}
        </ScrollView>
      </ThemedView>
    </ScreenLayout>
  );
}
