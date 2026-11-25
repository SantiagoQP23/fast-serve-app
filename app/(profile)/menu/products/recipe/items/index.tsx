import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Checkbox from "@/presentation/theme/components/checkbox";
import Chip from "@/presentation/theme/components/chip";
import TextInput from "@/presentation/theme/components/text-input";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import NewRecipeItemSheet, {
  type NewRecipeItemSheetRef,
} from "@/presentation/inventory/components/new-recipe-item-sheet";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useInventoryItemCategories } from "@/presentation/inventory/hooks/useInventoryItemCategories";
import { useRecipeDraftStore } from "@/presentation/inventory/store/recipeDraftStore";
import {
  isProductStockItem,
  type InventoryItem,
} from "@/core/inventory/models/inventory-item.model";

/** Chip id for the insumos that have no category. */
const NO_CATEGORY = "__no_category__";

/**
 * Picks the insumos a product uses: tap several, add them in one go, then the
 * recipe screen asks for each amount. Insumos not found can be created from
 * the search.
 */
export default function RecipeItemsPickerScreen() {
  const { t } = useTranslation(["inventory", "common"]);
  const { items, itemsQuery, createItem } = useInventoryItems();
  const { categories } = useInventoryItemCategories();
  const lines = useRecipeDraftStore((state) => state.lines);
  const queueItems = useRecipeDraftStore((state) => state.queueItems);
  const [search, setSearch] = useState("");
  const [pickedCategoryId, setCategoryId] = useState<string | null>(null);
  // Picked insumos, kept whole so a just-created one shows before the
  // catalog refetches.
  const [selected, setSelected] = useState<Map<string, InventoryItem>>(
    () => new Map(),
  );
  const createSheetRef = useRef<NewRecipeItemSheetRef>(null);

  const inRecipe = useMemo(
    () => new Set((lines ?? []).map((line) => line.inventoryItemId)),
    [lines],
  );

  // Insumos only: a variant's own stock never goes in a recipe.
  const insumos = useMemo(
    () => items.filter((item) => item.isActive && !isProductStockItem(item)),
    [items],
  );
  const hasUncategorized = insumos.some((item) => !item.category);
  // Categories are shared with the menu's own stock: only those holding an
  // insumo get a chip.
  const insumoCategories = useMemo(
    () =>
      categories.filter((category) =>
        insumos.some((item) => item.category?.id === category.id),
      ),
    [categories, insumos],
  );
  // No "All" chip: until the user picks one, the first category is active.
  const categoryId =
    pickedCategoryId ??
    insumoCategories[0]?.id ??
    (hasUncategorized ? NO_CATEGORY : null);

  const term = search.trim().toLowerCase();
  // Search spans every category so nothing hides behind the active chip.
  const visibleItems = useMemo(
    () =>
      insumos.filter((item) =>
        term
          ? item.name.toLowerCase().includes(term)
          : !categoryId ||
            (categoryId === NO_CATEGORY
              ? !item.category
              : item.category?.id === categoryId),
      ),
    [insumos, term, categoryId],
  );
  const exactMatch = insumos.some((item) => item.name.toLowerCase() === term);

  const toggle = (item: InventoryItem) =>
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(item.id)) next.delete(item.id);
      else next.set(item.id, item);
      return next;
    });

  const handleCreated = (item: InventoryItem) => {
    setSelected((current) => new Map(current).set(item.id, item));
    setSearch("");
  };

  const handleAdd = () => {
    queueItems([...selected.values()]);
    router.back();
  };

  return (
    <ScreenLayout style={tw`flex-1 bg-background`}>
      <ThemedView style={tw`px-4 pt-8 gap-4 bg-transparent`}>
        <InventoryScreenHeader title={t("productRecipe.addItems")} />

        <TextInput
          placeholder={t("searchPlaceholder")}
          icon="search"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />

        {!term && insumoCategories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`gap-2 items-center`}
          >
            {insumoCategories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                selected={categoryId === category.id}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
            {hasUncategorized && (
              <Chip
                label={t("categories.uncategorized")}
                selected={categoryId === NO_CATEGORY}
                onPress={() => setCategoryId(NO_CATEGORY)}
              />
            )}
          </ScrollView>
        )}
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={tw`px-4 pt-2 pb-8`}
      >
        {!exactMatch && (
          <Pressable
            onPress={() => createSheetRef.current?.present(search.trim())}
            accessibilityRole="button"
            style={({ pressed }) =>
              tw.style(
                "flex-row items-center gap-3 min-h-14 border-b border-divider",
                pressed && "opacity-70",
              )
            }
          >
            <Icon name="plus" size={22} color={tw.color("on-surface")} />
            <ThemedText
              type="body1"
              numberOfLines={1}
              style={[tw`flex-1`, { fontFamily: typography.bold }]}
            >
              {term
                ? t("productRecipe.createNamed", { name: search.trim() })
                : t("productRecipe.newItem")}
            </ThemedText>
          </Pressable>
        )}

        {itemsQuery.isLoading && (
          <ThemedText type="body1" style={tw`text-gray-500 text-center py-8`}>
            {t("loading")}
          </ThemedText>
        )}

        {!itemsQuery.isLoading && term && visibleItems.length === 0 && (
          <ThemedText type="body2" style={tw`text-gray-500 text-center py-8`}>
            {t("noResults")}
          </ThemedText>
        )}

        {visibleItems.map((item) => {
          const alreadyIn = inRecipe.has(item.id);
          return (
            <ThemedView
              key={item.id}
              style={tw`min-h-14 justify-center border-b border-divider bg-transparent`}
            >
              <Checkbox
                label={item.name}
                labelType="body1"
                value={alreadyIn || selected.has(item.id)}
                disabled={alreadyIn}
                onValueChange={() => toggle(item)}
                trailing={
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {alreadyIn
                      ? t("productRecipe.inRecipe")
                      : item.isUnlimited
                        ? t("unlimited.label")
                        : t(`units.${item.unit}`)}
                  </ThemedText>
                }
              />
            </ThemedView>
          );
        })}
      </ScrollView>

      {selected.size > 0 && (
        <ThemedView style={tw`px-4 pt-2 pb-2 bg-transparent`}>
          <Button
            label={t("productRecipe.addSelected", { count: selected.size })}
            onPress={handleAdd}
          />
        </ThemedView>
      )}

      <NewRecipeItemSheet
        ref={createSheetRef}
        onCreate={(input) =>
          createItem.mutateAsync({
            ...input,
            // Lands in the category being browsed, if any.
            categoryId:
              categoryId && categoryId !== NO_CATEGORY ? categoryId : null,
          })
        }
        onCreated={handleCreated}
      />
    </ScreenLayout>
  );
}
