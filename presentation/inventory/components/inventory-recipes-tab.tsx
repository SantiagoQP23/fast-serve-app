import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
// Horizontal rows use gesture-handler's ScrollView, so a swipe on them scrolls
// the row instead of switching the screen's tab (TabSwipeView)
import { ScrollView as GestureScrollView } from "react-native-gesture-handler";
import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { GroupedList } from "@/presentation/theme/components/grouped-list";
import Chip from "@/presentation/theme/components/chip";
import Label from "@/presentation/theme/components/label";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { isIngredientRecipe } from "@/core/inventory/models/inventory-recipe.model";
import {
  getProductOptionAvailableQuantity,
  getProductOptionStockLevel,
  type ProductOption,
  type ProductOptionStockLevel,
} from "@/core/menu/models/product-optionl.model";
import type { Product } from "@/core/menu/models/product.model";

type RecipeFilter = "all" | "out" | "low";

interface MenuVariant {
  product: Product;
  option: ProductOption;
  /** Product name plus the variant's when the product has several. */
  label: string;
  categoryName: string;
}

interface RecipeRow extends MenuVariant {
  available: number;
  stockLevel: ProductOptionStockLevel | null;
}

interface InventoryRecipesTabProps {
  /** Bumped by the parent's "+" button to open the new recipe picker. */
  newRecipeRequest?: number;
}

const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Every active menu variant that uses inventory ingredients, grouped by
 * menu category. Built from the menu kept on the phone, so it works
 * offline; tapping one opens its recipe.
 */
export default function InventoryRecipesTab({
  newRecipeRequest,
}: InventoryRecipesTabProps) {
  const { t } = useTranslation("inventory");
  const { products, categories, sections, menuQuery } = useMenu();
  const [filter, setFilter] = useState<RecipeFilter>("all");
  const [search, setSearch] = useState("");
  const pickerRef = useRef<BottomSheetPickerRef>(null);

  // Recipes can change from other screens or phones without a sync event,
  // so bring the menu up to date in the background when the tab opens.
  useEffect(() => {
    menuQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (newRecipeRequest) pickerRef.current?.present();
  }, [newRecipeRequest]);

  // Active variants in menu order: sections, then categories, then products.
  const variants = useMemo<MenuVariant[]>(() => {
    const sectionOrder = new Map(sections.map((s, index) => [s.id, index]));
    const categoryOrder = new Map(
      [...categories]
        .map((category, index) => ({ category, index }))
        .sort(
          (a, b) =>
            (sectionOrder.get(a.category.sectionId) ?? Infinity) -
              (sectionOrder.get(b.category.sectionId) ?? Infinity) ||
            a.index - b.index,
        )
        .map(({ category }, index) => [category.id, index]),
    );
    const orderOf = (product: Product) =>
      categoryOrder.get(product.category?.id) ?? Infinity;

    return products
      .map((product, index) => ({ product, index }))
      .filter(({ product }) => product.isActive)
      .sort(
        (a, b) => orderOf(a.product) - orderOf(b.product) || a.index - b.index,
      )
      .flatMap(({ product }) => {
        const options = (product.options ?? []).filter((o) => o.isActive);
        return options.map((option) => ({
          product,
          option,
          label:
            options.length > 1
              ? `${product.name} · ${option.name}`
              : product.name,
          categoryName: product.category?.name ?? t("recipes.noCategory"),
        }));
      });
  }, [products, categories, sections, t]);

  const recipes = useMemo<RecipeRow[]>(
    () =>
      variants
        .filter(({ option }) => isIngredientRecipe(option.inventoryItems))
        .map((variant) => {
          const available =
            getProductOptionAvailableQuantity(variant.option) ?? 0;
          return {
            ...variant,
            available,
            stockLevel: getProductOptionStockLevel(variant.option, available),
          };
        }),
    [variants],
  );

  const counts = useMemo(
    () => ({
      all: recipes.length,
      out: recipes.filter((r) => r.stockLevel === "out").length,
      low: recipes.filter((r) => r.stockLevel === "low").length,
    }),
    [recipes],
  );

  const groups = useMemo(() => {
    const term = normalize(search.trim());
    const visible = recipes.filter((recipe) => {
      if (filter !== "all" && recipe.stockLevel !== filter) return false;
      if (!term) return true;
      return [
        recipe.product.name,
        recipe.option.name,
        ...(recipe.option.inventoryItems ?? []).map(
          (line) => line.inventoryItem?.name ?? "",
        ),
      ].some((text) => normalize(text).includes(term));
    });

    const byCategory = new Map<string, RecipeRow[]>();
    for (const recipe of visible) {
      byCategory.set(recipe.categoryName, [
        ...(byCategory.get(recipe.categoryName) ?? []),
        recipe,
      ]);
    }
    return [...byCategory.entries()];
  }, [recipes, filter, search]);

  // Variants that could get a recipe: no lines yet (whole-product ones
  // already track their stock another way).
  const pickerOptions = useMemo(
    () =>
      variants
        .filter(({ option }) => !option.inventoryItems?.length)
        .map(({ option, label, categoryName }) => ({
          value: option.id,
          label,
          group: categoryName,
        })),
    [variants],
  );

  const openRecipe = ({ product, option }: MenuVariant) =>
    router.push({
      pathname: "/(profile)/menu/products/option-recipe",
      params: {
        productOptionId: String(option.id),
        productOptionName: option.name,
        productName: product.name,
      },
    });

  const handlePickVariant = (value: string | number) => {
    const variant = variants.find(({ option }) => option.id === value);
    pickerRef.current?.dismiss();
    if (variant) openRecipe(variant);
  };

  const isEmpty = recipes.length === 0;

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={tw`px-4 gap-6 pb-8 pt-6`}
        refreshControl={
          <RefreshControl
            refreshing={menuQuery.isFetching}
            onRefresh={() => menuQuery.refetch()}
            tintColor={tw.color("primary")}
            colors={[tw.color("primary") as string]}
          />
        }
      >
        {isEmpty ? (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="chef-hat" size={48} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("recipes.empty")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("recipes.emptyDescription")}
            </ThemedText>
            <Button
              label={t("recipes.create")}
              leftIcon="plus"
              variant="outline"
              size="small"
              onPress={() => pickerRef.current?.present()}
            />
          </ThemedView>
        ) : (
          <>
            <TextInput
              icon="search"
              variant="filled"
              placeholder={t("recipes.searchPlaceholder")}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            <GestureScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={tw`gap-2`}
            >
              {(["all", "out", "low"] as const).map((key) => (
                <Chip
                  key={key}
                  label={t(`recipes.filters.${key}`, { count: counts[key] })}
                  selected={filter === key}
                  onPress={() => setFilter(key)}
                />
              ))}
            </GestureScrollView>

            {groups.length === 0 && (
              <ThemedText
                type="body1"
                style={tw`text-gray-500 text-center py-8`}
              >
                {t("recipes.noResults")}
              </ThemedText>
            )}

            {groups.map(([categoryName, rows]) => (
              <ThemedView key={categoryName} style={tw`gap-3 bg-transparent`}>
                <ThemedText
                  type="caption"
                  style={tw`text-gray-500 font-semibold`}
                >
                  {categoryName}
                </ThemedText>
                <GroupedList
                  data={rows}
                  keyExtractor={(row) => String(row.option.id)}
                  onItemPress={openRecipe}
                  renderItem={(row) => (
                    <ThemedView
                      style={tw`flex-row items-center gap-3 bg-transparent`}
                    >
                      <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                        <ThemedText
                          type="body1"
                          numberOfLines={2}
                          style={{ fontFamily: typography.semibold }}
                        >
                          {row.label}
                        </ThemedText>
                        <ThemedView
                          style={tw`flex-row items-center gap-2 bg-transparent`}
                        >
                          {row.stockLevel === "out" ? (
                            <Label
                              text={t("optionInventory.outOfStock")}
                              color="error"
                              size="small"
                            />
                          ) : (
                            <>
                              <ThemedText
                                type="small"
                                style={tw`text-gray-500`}
                              >
                                {t("recipes.canMake", {
                                  count: row.available,
                                })}
                              </ThemedText>
                              {row.stockLevel === "low" && (
                                <Label
                                  text={t("status.low")}
                                  color="warning"
                                  size="small"
                                />
                              )}
                            </>
                          )}
                        </ThemedView>
                      </ThemedView>
                      <Icon
                        name="chevron-right"
                        size={18}
                        color={tw.color("gray-400")}
                      />
                    </ThemedView>
                  )}
                />
              </ThemedView>
            ))}
          </>
        )}
      </ScrollView>

      <BottomSheetPicker
        ref={pickerRef}
        title={t("recipes.new")}
        options={pickerOptions}
        onChange={handlePickVariant}
        searchable
        searchPlaceholder={t("recipes.pickVariant")}
      />
    </>
  );
}
