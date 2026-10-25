import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  InventoryItemKind,
  type InventoryItem,
} from "@/core/inventory/models/inventory-item.model";
import { InventoryService } from "../services/inventory.service";
import { inventoryItemsQueryKey } from "./useInventoryItems";
import type { InventoryItemStockStatusFilter } from "../interfaces/dto/find-all-inventory-items.dto";

const PAGE_SIZE = 20;

interface InventoryItemsBrowserFilters {
  categoryId?: string | null;
  uncategorized?: boolean;
  status?: InventoryItemStockStatusFilter | null;
  /** Name search, already trimmed and debounced by the caller. */
  search?: string;
}

/**
 * Paginated inventory list for the main browse screen, filtered server-side
 * by category/status/name search. Mirrors useOrderHistory's load-more accumulation —
 * items pile up across pages until the filters change, which resets back
 * to page 0.
 */
export const useInventoryItemsBrowser = (
  filters: InventoryItemsBrowserFilters = {},
) => {
  const { categoryId, uncategorized, status, search } = filters;
  const [page, setPage] = useState(0);
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);

  // Reset pagination during render when filters change, rather than in an
  // effect — see https://react.dev/learn/you-might-not-need-an-effect
  // ("Resetting all state when a prop changes").
  const [prevFilters, setPrevFilters] = useState({
    categoryId,
    uncategorized,
    status,
    search,
  });
  if (
    prevFilters.categoryId !== categoryId ||
    prevFilters.uncategorized !== uncategorized ||
    prevFilters.status !== status ||
    prevFilters.search !== search
  ) {
    setPrevFilters({ categoryId, uncategorized, status, search });
    setPage(0);
    setAllItems([]);
  }

  const query = useQuery({
    queryKey: [
      ...inventoryItemsQueryKey,
      "list",
      categoryId ?? null,
      uncategorized ?? false,
      status ?? null,
      search || null,
      page,
    ],
    queryFn: () =>
      InventoryService.getAll({
        categoryId: categoryId ?? undefined,
        uncategorized: uncategorized ?? undefined,
        status: status ?? undefined,
        search: search || undefined,
        // Insumos only; variant stock lives on the variant screen.
        kind: InventoryItemKind.INGREDIENT,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
  });

  useEffect(() => {
    if (!query.data) return;
    setAllItems((prev) =>
      page === 0 ? query.data.items : [...prev, ...query.data.items],
    );
  }, [query.data, page]);

  const count = query.data?.count ?? 0;

  const loadMore = useCallback(() => {
    if (allItems.length < count) setPage((prev) => prev + 1);
  }, [allItems.length, count]);

  return {
    itemsQuery: query,
    items: allItems,
    count,
    hasMore: (page + 1) * PAGE_SIZE < count,
    isLoadingMore: query.isLoading && page > 0,
    loadMore,
  };
};
