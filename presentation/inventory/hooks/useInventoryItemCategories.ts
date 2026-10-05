import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { queryClient } from "@/app/_layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import type { InventoryItemCategory } from "@/core/inventory/models/inventory-item-category.model";
import { InventoryItemCategoryService } from "../services/inventory-item-category.service";
import type { CreateInventoryItemCategoryDto } from "../interfaces/dto/create-inventory-item-category.dto";
import type { UpdateInventoryItemCategoryDto } from "../interfaces/dto/update-inventory-item-category.dto";

const inventoryCategoriesQueryKey = ["inventory-categories"];
const inventoryItemsQueryKey = ["inventory-items"];

export const useInventoryItemCategories = () => {
  const { t } = useTranslation("inventory");

  const categoriesQuery = useQuery({
    queryKey: inventoryCategoriesQueryKey,
    queryFn: () => InventoryItemCategoryService.getAll(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: inventoryCategoriesQueryKey });
    queryClient.invalidateQueries({ queryKey: inventoryItemsQueryKey });
  };

  const createCategory = useMutation<
    InventoryItemCategory,
    Error,
    CreateInventoryItemCategoryDto
  >({
    mutationFn: (data) => InventoryItemCategoryService.create(data),
    onSuccess: () => {
      invalidate();
    },
    onError: (error) => {
      toast.error(error.message || t("categories.createError"));
    },
  });

  const updateCategory = useMutation<
    InventoryItemCategory,
    Error,
    UpdateInventoryItemCategoryDto
  >({
    mutationFn: (data) => InventoryItemCategoryService.update(data),
    onSuccess: () => {
      invalidate();
    },
    onError: (error) => {
      toast.error(error.message || t("categories.updateError"));
    },
  });

  const deleteCategory = useMutation<void, Error, string>({
    mutationFn: (id) => InventoryItemCategoryService.remove(id),
    onSuccess: () => {
      toast.success(t("categories.deleteSuccess"));
      invalidate();
    },
    onError: (error) => {
      toast.error(error.message || t("categories.deleteError"));
    },
  });

  return {
    categoriesQuery,
    categories: categoriesQuery.data ?? [],
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
