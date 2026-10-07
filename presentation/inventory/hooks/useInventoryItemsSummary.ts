import { useQuery } from "@tanstack/react-query";
import { InventoryService } from "../services/inventory.service";
import { inventoryItemsQueryKey } from "./useInventoryItems";

interface InventoryItemsSummaryFilters {
  categoryId?: string | null;
  uncategorized?: boolean;
}

/**
 * Stock summary tile counts, computed by the backend over all matching
 * items — the main list is paginated, so counting over a loaded page (or
 * even the capped full-catalog fetch) would be wrong or unbounded.
 */
export const useInventoryItemsSummary = (
  filters: InventoryItemsSummaryFilters = {},
) => {
  const { categoryId, uncategorized } = filters;

  const summaryQuery = useQuery({
    queryKey: [
      ...inventoryItemsQueryKey,
      "summary",
      categoryId ?? null,
      uncategorized ?? false,
    ],
    queryFn: () =>
      InventoryService.getStockSummary({
        categoryId: categoryId ?? undefined,
        uncategorized: uncategorized ?? undefined,
      }),
  });

  return {
    summaryQuery,
    counts: summaryQuery.data ?? { critical: 0, low: 0, optimal: 0 },
  };
};
