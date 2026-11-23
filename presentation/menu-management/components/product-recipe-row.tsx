import { Pressable } from "react-native";
import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { DetailCard } from "@/presentation/theme/components/detail-card";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import type { Product } from "@/core/menu/models/product.model";
import { isProductStockItem } from "@/core/inventory/models/inventory-item.model";
import { getLineItemId } from "@/core/inventory/models/inventory-recipe.model";

/** Ingredients of the product across its variants, and how many can be removed. */
export function getRecipeSummary(product: Product) {
  const ingredients = new Map<string, boolean>();
  for (const option of product.options ?? [])
    for (const line of option.inventoryItems ?? []) {
      if (isProductStockItem(line.inventoryItem)) continue;
      const id = getLineItemId(line);
      ingredients.set(id, ingredients.get(id) || !!line.removable);
    }
  return {
    count: ingredients.size,
    removable: [...ingredients.values()].filter(Boolean).length,
  };
}

export const openProductRecipe = (productId: string, variantId?: number) =>
  router.push({
    pathname: "/(profile)/menu/products/recipe",
    params: {
      productId,
      ...(variantId !== undefined && { variantId: String(variantId) }),
    },
  });

/**
 * "Receta · 5 ingredientes, 2 se pueden quitar": opens the product's
 * recipe screen, where what it includes now lives
 * (plans/unificar-receta-incluidos.md).
 */
export default function ProductRecipeRow({ product }: { product: Product }) {
  const { t } = useTranslation("inventory");
  const { count, removable } = getRecipeSummary(product);
  const summary =
    count === 0
      ? t("productRecipe.rowEmpty")
      : removable > 0
        ? t("productRecipe.rowSummaryRemovable", { count, removable })
        : t("productRecipe.rowSummary", { count });

  return (
    <DetailCard style={tw`py-1`}>
      <Pressable
        onPress={() => openProductRecipe(product.id)}
        accessibilityRole="button"
        accessibilityLabel={`${t("productRecipe.title")}, ${summary}`}
        style={({ pressed }) =>
          tw.style(
            "flex-row items-center gap-3 py-3 min-h-14",
            pressed && "opacity-70",
          )
        }
      >
        <Icon name="chef-hat" size={20} color={tw.color("on-surface")} />
        <ThemedView style={tw`flex-1 gap-0.5 bg-transparent`}>
          <ThemedText style={{ fontFamily: typography.medium }}>
            {t("productRecipe.title")}
          </ThemedText>
          <ThemedText type="small" style={tw`text-gray-500`}>
            {summary}
          </ThemedText>
        </ThemedView>
        <Icon name="chevron-right" size={20} color={tw.color("gray-400")} />
      </Pressable>
    </DetailCard>
  );
}
