import { Platform, StyleSheet, ScrollView, Text } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import ProductCard from "@/presentation/restaurant-menu/product-card";
import { useCallback, useEffect, useState } from "react";
import Chip from "@/presentation/theme/components/chip";
import { useRouter } from "expo-router";
import TextInput from "@/presentation/theme/components/text-input";
import IconButton from "@/presentation/theme/components/icon-button";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { Category } from "@/core/menu/models/category.model";
import { Product } from "@/core/menu/models/product.model";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import Button from "@/presentation/theme/components/button";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";

export default function RestaurantMenuScreen() {
  const { t } = useTranslation(["menu"]);
  const [section, setSection] = useState("");
  const [category, setCategory] = useState("");
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { categories, sections, products, menuQuery } = useMenu();
  const { setActiveProduct } = useMenuStore();
  const details = useNewOrderStore((state) => state.details);
  const order = useOrdersStore((state) => state.activeOrder);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  const handleLoadMenu = async () => {
    setIsLoadingMenu(true);
    try {
      await menuQuery.refetch();
    } catch (error) {
      // Error is handled by React Query
    } finally {
      setIsLoadingMenu(false);
    }
  };

  const openProduct = (product: Product) => {
    setActiveProduct(product);
    router.push("/restaurant-menu/product");
  };

  const onChangeCategory = useCallback(
    (value: string) => {
      setCategory(value);
      setFilteredProducts(products.filter((p) => p.category.id === value));
    },
    [products],
  );

  const onChangeSection = useCallback(
    (value: string) => {
      setSection(value);
      setFilteredCategories(() => {
        const newCategories = categories.filter((c) => c.section.id === value);
        if (newCategories.length > 0) onChangeCategory(newCategories[0].id);
        else onChangeCategory("");
        return newCategories;
      });
    },
    [categories, onChangeCategory],
  );

  const onSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (value) {
        setFilteredProducts(
          products.filter((p) =>
            p.name.toLowerCase().includes(value.toLowerCase()),
          ),
        );
      } else {
        setFilteredProducts(products.filter((p) => p.category.id === category));
      }
    },
    [products, category],
  );

  useEffect(() => {
    if (sections.length > 0 && !section) {
      onChangeSection(sections[0].id);
    }
  }, [sections, section, onChangeSection]);

  useEffect(() => {
    if (filteredCategories.length > 0 && !category) {
      onChangeCategory(filteredCategories[0].id);
    }
  }, [filteredCategories, category, onChangeCategory]);

  // Check if menu is loaded
  const hasMenu = sections.length > 0 || categories.length > 0 || products.length > 0;

  // Show empty state if no menu loaded
  if (!hasMenu) {
    return (
      <ThemedView style={tw`flex-1 px-4 pt-8 items-center justify-center gap-4`}>
        <Ionicons name="restaurant-outline" size={64} color="#999" />
        <ThemedView style={tw`gap-2 items-center`}>
          <ThemedText type="h2">{t("menu:noMenu.title")}</ThemedText>
          <ThemedText type="body2" style={tw`text-center text-gray-500 px-8`}>
            {t("menu:noMenu.description")}
          </ThemedText>
        </ThemedView>
        <Button
          label={
            menuQuery.isError
              ? t("menu:noMenu.retry")
              : isLoadingMenu
              ? t("menu:noMenu.loading")
              : t("menu:noMenu.loadButton")
          }
          leftIcon="cloud-download-outline"
          onPress={handleLoadMenu}
          disabled={isLoadingMenu}
          loading={isLoadingMenu}
        />
        {menuQuery.isError && (
          <ThemedText type="body2" style={tw`text-red-500 text-center px-8`}>
            {t("menu:noMenu.error")}
          </ThemedText>
        )}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ThemedText type="h1">{t("menu:title")}</ThemedText>
      <TextInput
        value={search}
        onChangeText={(value) => onSearchChange(value)}
        icon="search-outline"
        leftIcon={
          search && (
            <IconButton
              icon="close-circle-outline"
              onPress={() => onSearchChange("")}
            ></IconButton>
          )
        }
      />
      {!search && (
        <ThemedView>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={tw`gap-2`}
          >
            {sections.map((f) => (
              <ThemedView style={tw`mr-2`} key={f.id}>
                <Chip
                  label={f.name}
                  selected={section === f.id}
                  onPress={() => onChangeSection(f.id)}
                />
              </ThemedView>
            ))}
          </ScrollView>
        </ThemedView>
      )}
      <ThemedView style={tw` flex-row gap-2`}>
        {!search && (
          <ThemedView style={tw` flex-wrap gap-2 `}>
            {filteredCategories.map((f) => (
              <Chip
                key={f.id}
                label={f.name}
                selected={category === f.id}
                onPress={() => onChangeCategory(f.id)}
              />
            ))}
          </ThemedView>
        )}
        <ScrollView
          style={tw`flex-1 mb-20`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-3 pb-40`}
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              onPress={() => openProduct(product)}
              product={product}
            ></ProductCard>
          ))}
        </ScrollView>
      </ThemedView>

      {!order && details.length > 0 && (
        <ThemedView style={tw`absolute bottom-4 left-4 right-4 bg-transparent`}>
          <ThemedView
            style={tw`flex-row justify-end items-center bg-transparent`}
          >
            <Button
              label={t("menu:goToCart")}
              leftIcon="cart-outline"
              onPress={() => router.push("/(new-order)/cart")}
            />
          </ThemedView>
        </ThemedView>
      )}
    </ThemedView>
  );
}
