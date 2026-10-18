import { useMemo } from "react";
import {
  isInventoryItemLow,
  type InventoryItem,
} from "@/core/inventory/models/inventory-item.model";
import { useInventoryItems } from "./useInventoryItems";

const stockRatio = (item: InventoryItem) =>
  item.quantity / (item.minimumQuantity as number);

/**
 * Low-stock items for the shopping list, most urgent (lowest stock to
 * minimum ratio) first. Built from the full catalog query, so it also
 * works offline from the cached catalog.
 */
export const useShoppingList = () => {
  const { items, itemsQuery } = useInventoryItems();

  const lowItems = useMemo(
    () =>
      items
        .filter(isInventoryItemLow)
        .sort(
          (a, b) =>
            stockRatio(a) - stockRatio(b) || a.name.localeCompare(b.name),
        ),
    [items],
  );

  return { lowItems, itemsQuery };
};
