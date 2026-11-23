import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { queryClient } from "@/app/_layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getErrorMessage } from "@/core/api/get-error-message";
import {
  ProductRecipeService,
  type ProductRecipe,
  type SaveProductRecipeInput,
} from "../services/product-recipe.service";
import { refreshOptionRecipeInMenu } from "../services/refresh-option-recipe-in-menu";
import { inventoryItemsQueryKey } from "./useInventoryItems";

export const productRecipeQueryKey = (productId: string) => [
  "product-recipe",
  productId,
];

/** A product's recipe on every variant, and saving it in one go. */
export const useProductRecipe = (productId: string) => {
  const { t } = useTranslation("inventory");

  const recipeQuery = useQuery({
    queryKey: productRecipeQueryKey(productId),
    queryFn: () => ProductRecipeService.get(productId),
    enabled: !!productId,
  });

  const saveRecipe = useMutation<ProductRecipe, Error, SaveProductRecipeInput>({
    mutationFn: (input) => ProductRecipeService.save(productId, input),
    onSuccess: async (recipe) => {
      queryClient.setQueryData(productRecipeQueryKey(productId), recipe);
      queryClient.invalidateQueries({ queryKey: inventoryItemsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      // The phone's menu holds each variant's recipe (stock, chips).
      await Promise.all(
        recipe.variants.map((variant) => refreshOptionRecipeInMenu(variant.id)),
      );
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, { fallback: t("productRecipe.saveError") }),
      );
    },
  });

  return { recipeQuery, recipe: recipeQuery.data, saveRecipe };
};
