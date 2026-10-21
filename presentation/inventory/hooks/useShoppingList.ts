import { useMemo } from "react";
import {
  isInventoryItemBelowMinimum,
  isInventoryItemOutWithoutMinimum,
  type InventoryItem,
} from "@/core/inventory/models/inventory-item.model";
import { useInventoryItems } from "./useInventoryItems";

const stockRatio = (item: InventoryItem) =>
  item.quantity / (item.minimumQuantity as number);

/**
 * Items below their minimum for the shopping list, most urgent (lowest stock to
 * minimum ratio) first. Built from the full catalog query, so it also
 * works offline from the cached catalog.
 *
 * `outWithoutMinimum` are out of stock but have no minimum, so there's no
 * amount to suggest — listed apart so they aren't silently missed.
 */
export const useShoppingList = () => {
  const { items, itemsQuery } = useInventoryItems();

  const lowItems = useMemo(
    () =>
      items
        .filter(isInventoryItemBelowMinimum)
        .sort(
          (a, b) =>
            stockRatio(a) - stockRatio(b) || a.name.localeCompare(b.name),
        ),
    [items],
  );

  const outWithoutMinimum = useMemo(
    () =>
      items
        .filter(isInventoryItemOutWithoutMinimum)
        .sort(
          (a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name),
        ),
    [items],
  );

  return { lowItems, outWithoutMinimum, itemsQuery };
};
