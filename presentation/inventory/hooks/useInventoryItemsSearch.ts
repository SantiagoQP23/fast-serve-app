import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InventoryService } from "../services/inventory.service";
import { inventoryItemsQueryKey } from "./useInventoryItems";

const SEARCH_DEBOUNCE_MS = 400;

export const useInventoryItemsSearch = (debounceMs = SEARCH_DEBOUNCE_MS) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSearch(search.trim()),
      debounceMs,
    );
    return () => clearTimeout(timeout);
  }, [search, debounceMs]);

  const itemsQuery = useQuery({
    queryKey: [...inventoryItemsQueryKey, "search", debouncedSearch],
    queryFn: () => InventoryService.getAll({ search: debouncedSearch }),
    enabled: !!debouncedSearch,
  });

  return {
    search,
    handleChangeSearch: setSearch,
    hasSearchTerm: !!debouncedSearch,
    items: itemsQuery.data?.items ?? [],
    itemsQuery,
  };
};
