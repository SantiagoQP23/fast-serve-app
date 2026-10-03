import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { queryClient } from "@/app/_layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import type { ProductOptionInventoryItem } from "@/core/inventory/models/inventory-recipe.model";
import { InventoryRecipeService } from "../services/inventory-recipe.service";
import type { CreateRecipeDto } from "../interfaces/dto/create-recipe.dto";
import type { UpdateRecipeDto } from "../interfaces/dto/update-recipe.dto";

const getRecipesQueryKey = (productOptionId?: number) => [
  "inventory-recipes",
  productOptionId,
];

export const useInventoryRecipes = (productOptionId?: number) => {
  const { t } = useTranslation("inventory");

  const recipesQuery = useQuery({
    queryKey: getRecipesQueryKey(productOptionId),
    queryFn: () =>
      InventoryRecipeService.getByProductOption(productOptionId!),
    enabled: !!productOptionId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: getRecipesQueryKey(productOptionId),
    });

  const createRecipe = useMutation<
    ProductOptionInventoryItem,
    Error,
    CreateRecipeDto & { silent?: boolean }
  >({
    mutationFn: ({ silent, ...data }) => InventoryRecipeService.create(data),
    onSuccess: (_data, variables) => {
      if (!variables.silent) toast.success(t("recipe.createSuccess"));
      invalidate();
    },
    onError: (error, variables) => {
      if (!variables.silent) toast.error(error.message || t("recipe.createError"));
    },
  });

  const updateRecipe = useMutation<
    ProductOptionInventoryItem,
    Error,
    UpdateRecipeDto & { silent?: boolean }
  >({
    mutationFn: ({ silent, ...data }) => InventoryRecipeService.update(data),
    onSuccess: (_data, variables) => {
      if (!variables.silent) toast.success(t("recipe.updateSuccess"));
      invalidate();
    },
    onError: (error, variables) => {
      if (!variables.silent) toast.error(error.message || t("recipe.updateError"));
    },
  });

  const deleteRecipe = useMutation<
    void,
    Error,
    { id: string; silent?: boolean }
  >({
    mutationFn: ({ id }) => InventoryRecipeService.remove(id),
    onSuccess: (_data, variables) => {
      if (!variables.silent) toast.success(t("recipe.deleteSuccess"));
      invalidate();
    },
    onError: (error, variables) => {
      if (!variables.silent) toast.error(error.message || t("recipe.deleteError"));
    },
  });

  return {
    recipesQuery,
    recipes: recipesQuery.data ?? [],
    createRecipe,
    updateRecipe,
    deleteRecipe,
  };
};
