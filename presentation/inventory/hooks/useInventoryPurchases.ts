import { useMemo } from "react";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { queryClient } from "@/app/_layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import type { InventoryPurchase } from "@/core/inventory/models/inventory-purchase.model";
import { InventoryPurchaseService } from "../services/inventory-purchase.service";
import type { CreateInventoryPurchaseDto } from "../interfaces/dto/create-inventory-purchase.dto";
import { inventoryItemsQueryKey } from "./useInventoryItems";

export const inventoryPurchasesQueryKey = ["inventory-purchases"];

const PAGE_SIZE = 20;

// A purchase changes stock on every item it touches, so item lists, item
// details and their movement histories all need a refetch.
const invalidateAfterStockChange = () => {
  queryClient.invalidateQueries({ queryKey: inventoryPurchasesQueryKey });
  queryClient.invalidateQueries({ queryKey: inventoryItemsQueryKey });
  queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
};

/** Paginated purchase history, newest first, accumulated with load-more. */
export const useInventoryPurchases = () => {
  const query = useInfiniteQuery({
    queryKey: [...inventoryPurchasesQueryKey, "list"],
    queryFn: ({ pageParam }) =>
      InventoryPurchaseService.getAll({ limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce(
        (acc, page) => acc + page.purchases.length,
        0,
      );
      return loaded < lastPage.count ? loaded : undefined;
    },
  });

  const purchases = useMemo(
    () => query.data?.pages.flatMap((page) => page.purchases) ?? [],
    [query.data],
  );

  return {
    purchasesQuery: query,
    purchases,
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => query.fetchNextPage(),
    refresh: () => query.refetch(),
  };
};

export const useInventoryPurchase = (purchaseId?: string) => {
  const { t } = useTranslation("inventory");

  const purchaseQuery = useQuery({
    queryKey: [...inventoryPurchasesQueryKey, purchaseId],
    queryFn: () => InventoryPurchaseService.getById(purchaseId!),
    enabled: !!purchaseId,
  });

  const setPurchase = (purchase: InventoryPurchase) =>
    queryClient.setQueryData(
      [...inventoryPurchasesQueryKey, purchase.id],
      purchase,
    );

  const updateItem = useMutation<
    InventoryPurchase,
    Error,
    { itemId: string; quantity: number }
  >({
    mutationFn: ({ itemId, quantity }) =>
      InventoryPurchaseService.updateItem(purchaseId!, itemId, quantity),
    onSuccess: (purchase) => {
      toast.success(t("purchases.updateItemSuccess"));
      setPurchase(purchase);
      invalidateAfterStockChange();
    },
    onError: (error) => {
      toast.error(error.message || t("purchases.updateItemError"));
    },
  });

  const removeItem = useMutation<InventoryPurchase, Error, string>({
    mutationFn: (itemId) =>
      InventoryPurchaseService.removeItem(purchaseId!, itemId),
    onSuccess: (purchase) => {
      toast.success(t("purchases.removeItemSuccess"));
      setPurchase(purchase);
      invalidateAfterStockChange();
    },
    onError: (error) => {
      toast.error(error.message || t("purchases.removeItemError"));
    },
  });

  return {
    purchaseQuery,
    purchase: purchaseQuery.data,
    updateItem,
    removeItem,
  };
};

export const useCreateInventoryPurchase = () => {
  const { t } = useTranslation("inventory");

  return useMutation<InventoryPurchase, Error, CreateInventoryPurchaseDto>({
    mutationFn: (data) => InventoryPurchaseService.create(data),
    onSuccess: (purchase) => {
      toast.success(t("purchases.createSuccess"));
      queryClient.setQueryData(
        [...inventoryPurchasesQueryKey, purchase.id],
        purchase,
      );
      invalidateAfterStockChange();
    },
    onError: (error) => {
      toast.error(error.message || t("purchases.createError"));
    },
  });
};
