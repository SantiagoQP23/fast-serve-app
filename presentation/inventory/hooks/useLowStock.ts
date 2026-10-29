import { useMemo } from "react";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useInventoryItems } from "./useInventoryItems";
import {
  getProductStockAttention,
  getProductStockSummary,
  type Product,
  type ProductStockAttention,
} from "@/core/menu/models/product.model";
import {
  getInventoryStockStatus,
  isProductStockItem,
  type InventoryItem,
} from "@/core/inventory/models/inventory-item.model";

const ATTENTION_ORDER: Record<ProductStockAttention, number> = {
  out: 0,
  low: 1,
};

/** Lower is more urgent: against the minimum, or the raw stock without one. */
const stockRatio = (item: InventoryItem) =>
  item.minimumQuantity && item.minimumQuantity > 0
    ? item.quantity / item.minimumQuantity
    : item.quantity;

/**
 * What needs restocking, for the Productos "Stock bajo" tab: menu products
 * the Menú page counts as Agotados / Stock bajo, and insumos the Insumos
 * page counts as critical / low. Most urgent first in each list.
 */
export const useLowStock = () => {
  const { products: menuProducts, menuQuery } = useMenu();
  const { items: allItems, itemsQuery } = useInventoryItems();

  const products = useMemo(() => {
    const attention = new Map<string, ProductStockAttention>();
    for (const product of menuProducts) {
      if (!product.isActive) continue;
      const level = getProductStockAttention(getProductStockSummary(product));
      if (level) attention.set(product.id, level);
    }
    const order = (product: Product) =>
      ATTENTION_ORDER[attention.get(product.id) as ProductStockAttention];
    return menuProducts
      .filter((product) => attention.has(product.id))
      .sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name));
  }, [menuProducts]);

  const items = useMemo(() => {
    // Variant stock shows on its product above, not among the insumos.
    const low = allItems.flatMap((item) => {
      if (isProductStockItem(item)) return [];
      const status = getInventoryStockStatus(item);
      return status === "critical" || status === "low"
        ? [{ item, critical: status === "critical" }]
        : [];
    });
    return low
      .sort(
        (a, b) =>
          Number(b.critical) - Number(a.critical) ||
          stockRatio(a.item) - stockRatio(b.item) ||
          a.item.name.localeCompare(b.item.name),
      )
      .map(({ item }) => item);
  }, [allItems]);

  const isLoading =
    (menuQuery.isLoading && menuProducts.length === 0) || itemsQuery.isLoading;
  const isError = menuQuery.isError || itemsQuery.isError;
  const isFetching = menuQuery.isFetching || itemsQuery.isFetching;
  const refetch = () => Promise.all([menuQuery.refetch(), itemsQuery.refetch()]);

  return {
    products,
    items,
    total: products.length + items.length,
    isLoading,
    isError,
    isFetching,
    refetch,
  };
};
