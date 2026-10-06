import { useMemo } from "react";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { queryClient } from "@/app/_layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import type {
  InventoryCount,
  InventoryCountAnswer,
} from "@/core/inventory/models/inventory-count.model";
import { InventoryCountService } from "../services/inventory-count.service";
import { inventoryItemsQueryKey } from "./useInventoryItems";

export const inventoryCountsQueryKey = ["inventory-counts"];

const PAGE_SIZE = 20;

const setCount = (count: InventoryCount) =>
  queryClient.setQueryData([...inventoryCountsQueryKey, count.id], count);

const invalidateCountList = () =>
  queryClient.invalidateQueries({
    queryKey: [...inventoryCountsQueryKey, "list"],
  });

// A count correction changes stock, so item lists, item details and their
// movement histories all need a refetch.
const invalidateAfterStockChange = () => {
  invalidateCountList();
  queryClient.invalidateQueries({ queryKey: inventoryItemsQueryKey });
  queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
};

/** Paginated count history, newest first, accumulated with load-more. */
export const useInventoryCounts = () => {
  const query = useInfiniteQuery({
    queryKey: [...inventoryCountsQueryKey, "list"],
    queryFn: ({ pageParam }) =>
      InventoryCountService.getAll({ limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((acc, page) => acc + page.counts.length, 0);
      return loaded < lastPage.count ? loaded : undefined;
    },
  });

  const counts = useMemo(
    () => query.data?.pages.flatMap((page) => page.counts) ?? [],
    [query.data],
  );

  return {
    countsQuery: query,
    counts,
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => query.fetchNextPage(),
    refresh: () => query.refetch(),
  };
};

export const useInventoryCount = (countId?: string) => {
  const { t } = useTranslation("inventory");

  const countQuery = useQuery({
    queryKey: [...inventoryCountsQueryKey, countId],
    queryFn: () => InventoryCountService.getById(countId!),
    enabled: !!countId,
  });

  const answerItem = useMutation<
    InventoryCount,
    Error,
    { itemId: string; answer: InventoryCountAnswer; countedQuantity?: number }
  >({
    mutationFn: ({ itemId, answer, countedQuantity }) =>
      InventoryCountService.answerItem(
        countId!,
        itemId,
        answer,
        countedQuantity,
      ),
    onSuccess: (count) => {
      setCount(count);
      invalidateAfterStockChange();
    },
    onError: (error) => {
      toast.error(error.message || t("counts.answerError"));
    },
  });

  const addItems = useMutation<InventoryCount, Error, string[]>({
    mutationFn: (inventoryItemIds) =>
      InventoryCountService.addItems(countId!, inventoryItemIds),
    onSuccess: (count) => {
      setCount(count);
      invalidateCountList();
    },
    onError: (error) => {
      toast.error(error.message || t("counts.addItemsError"));
    },
  });

  const complete = useMutation<InventoryCount, Error, void>({
    mutationFn: () => InventoryCountService.complete(countId!),
    onSuccess: (count) => {
      setCount(count);
      invalidateCountList();
    },
    onError: (error) => {
      toast.error(error.message || t("counts.completeError"));
    },
  });

  return {
    countQuery,
    count: countQuery.data,
    answerItem,
    addItems,
    complete,
  };
};

export const useCreateInventoryCount = () => {
  const { t } = useTranslation("inventory");

  return useMutation<
    InventoryCount,
    Error,
    { inventoryItemIds: string[]; idempotencyKey: string }
  >({
    mutationFn: (data) => InventoryCountService.create(data),
    onSuccess: (count) => {
      setCount(count);
      invalidateCountList();
    },
    onError: (error) => {
      toast.error(error.message || t("counts.createError"));
    },
  });
};
