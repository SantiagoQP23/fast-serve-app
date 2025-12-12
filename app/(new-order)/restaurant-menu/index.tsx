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

export default function RestaurantMenuScreen() {
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

  useEffect(() => {
    menuQuery.refetch();
  }, []);

  return (
    <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ThemedText type="h1">Menu</ThemedText>
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
          contentContainerStyle={tw`gap-3 pb-20`}
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
        <ThemedView style={tw`absolute bottom-4 left-4 right-4 `}>
          <ThemedView style={tw`flex-row justify-between items-center`}>
            <ThemedView>
              <ThemedText>Added products: {details.length}</ThemedText>
            </ThemedView>
            <Button
              label="Go to cart "
              leftIcon="cart-outline"
              onPress={() => router.push("/(new-order)/cart")}
            />
          </ThemedView>
        </ThemedView>
      )}
    </ThemedView>
  );
}
