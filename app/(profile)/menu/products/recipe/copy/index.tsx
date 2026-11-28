import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Chip from "@/presentation/theme/components/chip";
import Label from "@/presentation/theme/components/label";
import TextInput from "@/presentation/theme/components/text-input";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import CopyRecipeSheet, {
  type CopyRecipeSheetRef,
} from "@/presentation/inventory/components/copy-recipe-sheet";
import { useRecipeDraftStore } from "@/presentation/inventory/store/recipeDraftStore";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { isProductStockItem } from "@/core/inventory/models/inventory-item.model";
import type { Product } from "@/core/menu/models/product.model";

/** Chip id for "every category". */
const ALL = "__all__";

/** Recipe insumos per variant, own stock (a Coca-Cola's) left out. */
const recipeCounts = (product: Product) =>
  (product.options ?? [])
    .map((option) => ({
      name: option.name,
      count: (option.inventoryItems ?? []).filter(
        (line) => line.inventoryItem && !isProductStockItem(line.inventoryItem),
      ).length,
    }))
    .filter((entry) => entry.count > 0);

/**
 * Picks the product whose recipe to copy (plans/copiar-receta.md). Only
 * products with a recipe are listed, read from the phone's menu; the confirm
 * sheet loads the full recipe and hands the copy to the recipe screen.
 */
export default function CopyRecipeScreen() {
  const { t } = useTranslation(["inventory", "common"]);
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { user } = useAuthStore();
  const canSetRemovals = isAdminLevelRole(user?.role?.name);
  const products = useMenuStore((state) => state.products);
  const lines = useRecipeDraftStore((state) => state.lines);
  const queueCopy = useRecipeDraftStore((state) => state.queueCopy);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState(ALL);
  const sheetRef = useRef<CopyRecipeSheetRef>(null);

  const target = products.find((product) => product.id === productId);
  const variants = useMemo(
    () =>
      (target?.options ?? [])
        .filter((option) => option.isActive)
        .map(({ id, name }) => ({ id, name })),
    [target],
  );

  // Active products first; inactive ones still have a useful recipe.
  const sources = useMemo(
    () =>
      products
        .filter((product) => product.id !== productId)
        .map((product) => ({ product, counts: recipeCounts(product) }))
        .filter((entry) => entry.counts.length > 0)
        .sort(
          (a, b) =>
            Number(b.product.isActive) - Number(a.product.isActive) ||
            a.product.name.localeCompare(b.product.name),
        ),
    [products, productId],
  );

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const { product } of sources)
      if (product.category) seen.set(product.category.id, product.category.name);
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [sources]);

  const term = search.trim().toLowerCase();
  // Search spans every category so nothing hides behind the active chip.
  const visible = sources.filter(({ product }) =>
    term
      ? product.name.toLowerCase().includes(term)
      : categoryId === ALL || product.category?.id === categoryId,
  );

  const summary = (counts: { name: string; count: number }[]) =>
    counts.length === 1
      ? t("productRecipe.rowSummary", { count: counts[0].count })
      : counts.map((entry) => `${entry.name} ${entry.count}`).join(" · ");

  return (
    <ScreenLayout style={tw`flex-1 bg-background`}>
      <ThemedView style={tw`px-4 pt-8 gap-4 bg-transparent`}>
        <InventoryScreenHeader title={t("productRecipe.copy.title")} />

        <TextInput
          placeholder={t("searchPlaceholder")}
          icon="search"
          containerStyle={tw`rounded-full`}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />

        {!term && categories.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`gap-2 items-center`}
          >
            <Chip
              label={t("productRecipe.copy.allCategories")}
              selected={categoryId === ALL}
              onPress={() => setCategoryId(ALL)}
            />
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                selected={categoryId === category.id}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
          </ScrollView>
        )}
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={tw`px-4 pt-2 pb-8`}
      >
        {sources.length === 0 && (
          <ThemedView style={tw`items-center py-10 gap-3 bg-transparent`}>
            <Icon name="chef-hat" size={48} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={tw`text-gray-500 text-center`}>
              {t("productRecipe.copy.none")}
            </ThemedText>
          </ThemedView>
        )}

        {sources.length > 0 && visible.length === 0 && (
          <ThemedText type="body2" style={tw`text-gray-500 text-center py-8`}>
            {t("noResults")}
          </ThemedText>
        )}

        {visible.map(({ product, counts }) => (
          <Pressable
            key={product.id}
            onPress={() =>
              sheetRef.current?.present({ id: product.id, name: product.name })
            }
            accessibilityRole="button"
            style={({ pressed }) =>
              tw.style(
                "flex-row items-center gap-3 min-h-16 py-2 border-b border-divider",
                pressed && "opacity-70",
              )
            }
          >
            <ThemedView style={tw`flex-1 gap-0.5 bg-transparent`}>
              <ThemedText
                type="body1"
                numberOfLines={2}
                style={{ fontFamily: typography.medium }}
              >
                {product.name}
              </ThemedText>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {[product.category?.name, summary(counts)]
                  .filter(Boolean)
                  .join(" · ")}
              </ThemedText>
            </ThemedView>
            {!product.isActive && (
              <Label size="small" text={t("status.inactive")} />
            )}
            <Icon
              name="chevron-right"
              size={20}
              color={tw.color("gray-400")}
            />
          </Pressable>
        ))}
      </ScrollView>

      <CopyRecipeSheet
        ref={sheetRef}
        variants={variants}
        current={lines ?? []}
        canSetRemovals={canSetRemovals}
        onCopy={(copy) => {
          queueCopy(copy);
          router.back();
        }}
      />
    </ScreenLayout>
  );
}
