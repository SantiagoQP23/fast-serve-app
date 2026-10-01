import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { queryClient } from "@/app/_layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";
import { InventoryService } from "../services/inventory.service";
import type { CreateInventoryItemDto } from "../interfaces/dto/create-inventory-item.dto";
import type { UpdateInventoryItemDto } from "../interfaces/dto/update-inventory-item.dto";
import type { AdjustInventoryDto } from "../interfaces/dto/adjust-inventory.dto";

const inventoryItemsQueryKey = ["inventory-items"];

export const useInventoryItems = () => {
  const { t } = useTranslation("inventory");

  const itemsQuery = useQuery({
    queryKey: inventoryItemsQueryKey,
    queryFn: () => InventoryService.getAll(),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: inventoryItemsQueryKey });

  const createItem = useMutation<
    InventoryItem,
    Error,
    CreateInventoryItemDto
  >({
    mutationFn: (data) => InventoryService.create(data),
    onSuccess: () => {
      toast.success(t("createSuccess"));
      invalidate();
    },
    onError: (error) => {
      toast.error(error.message || t("createError"));
    },
  });

  const updateItem = useMutation<
    InventoryItem,
    Error,
    UpdateInventoryItemDto
  >({
    mutationFn: (data) => InventoryService.update(data),
    onSuccess: () => {
      toast.success(t("updateSuccess"));
      invalidate();
    },
    onError: (error) => {
      toast.error(error.message || t("updateError"));
    },
  });

  const deleteItem = useMutation<void, Error, string>({
    mutationFn: (id) => InventoryService.remove(id),
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      invalidate();
    },
    onError: (error) => {
      toast.error(error.message || t("deleteError"));
    },
  });

  const adjustStock = useMutation<void, Error, AdjustInventoryDto>({
    mutationFn: async (data) => {
      await InventoryService.adjust(data);
    },
    onSuccess: (_data, variables) => {
      toast.success(t("adjustSuccess"));
      invalidate();
      queryClient.invalidateQueries({
        queryKey: ["inventory-movements", variables.inventoryItemId],
      });
    },
    onError: (error) => {
      toast.error(error.message || t("adjustError"));
    },
  });

  return {
    itemsQuery,
    items: itemsQuery.data ?? [],
    createItem,
    updateItem,
    deleteItem,
    adjustStock,
  };
};
