import type { InventoryItemCategory } from "./inventory-item-category.model";
import type { ProductOptionInventoryItem } from "./inventory-recipe.model";

export enum InventoryUnit {
  UNIT = "UNIT",
  KG = "KG",
  G = "G",
  L = "L",
  ML = "ML",
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: InventoryUnit;
  quantity: number;
  minimumQuantity?: number | null;
  isActive: boolean;
  category?: InventoryItemCategory | null;
  restaurant?: { id: string; name: string };
  productOptionsCount?: number;
  /** Product options (recipe lines) that consume this item. */
  productOptions?: ProductOptionInventoryItem[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export type InventoryStockStatus =
  "critical" | "low" | "optimal" | "noMinimum" | "inactive";

const hasMinimum = (item: InventoryItem) =>
  item.minimumQuantity != null && item.minimumQuantity > 0;

/**
 * Stock health of an item. Must stay in sync with the backend's
 * STOCK_STATUS_SQL (inventory-items.service), which counts the summary
 * tiles and filters the list they open:
 * - out of stock (0 or negative) is critical even with no minimum set;
 * - with no minimum there's nothing to measure against, so it's
 *   "noMinimum", never "optimal";
 * - critical at or below half the minimum, low below it, optimal at or
 *   above it — the same line the shopping list draws.
 */
export function getInventoryStockStatus(
  item: InventoryItem,
): InventoryStockStatus {
  if (!item.isActive) return "inactive";
  if (item.quantity <= 0) return "critical";
  if (!hasMinimum(item)) return "noMinimum";

  const minimum = item.minimumQuantity as number;
  if (item.quantity <= minimum * 0.5) return "critical";
  if (item.quantity < minimum) return "low";
  return "optimal";
}

/** Fill ratio (0-1) for a stock level bar, relative to the minimum quantity. */
export function getInventoryStockRatio(item: InventoryItem): number {
  if (!hasMinimum(item)) return 1;
  return Math.min(
    Math.max(item.quantity / (item.minimumQuantity as number), 0),
    1,
  );
}

/**
 * Items for the shopping list: active, with a minimum set, and strictly
 * below it (critical or low) — an item sitting exactly at its minimum has
 * nothing to buy.
 */
export function isInventoryItemBelowMinimum(item: InventoryItem): boolean {
  return (
    item.isActive &&
    hasMinimum(item) &&
    item.quantity < (item.minimumQuantity as number)
  );
}

/**
 * Amount needed to get back to the minimum, rounded up (whole units for
 * UNIT, 2 decimals otherwise). 0 when the item is already at the minimum.
 */
export function getSuggestedPurchaseQuantity(item: InventoryItem): number {
  if (!hasMinimum(item)) return 0;
  const missing = (item.minimumQuantity as number) - item.quantity;
  if (missing <= 0) return 0;
  if (item.unit === InventoryUnit.UNIT) return Math.ceil(missing - 1e-9);
  return Math.ceil(missing * 100 - 1e-6) / 100;
}

/**
 * Out of stock with no minimum set: critical, but the shopping list can't
 * suggest how much to buy, so it lists these apart, asking for a minimum.
 */
export function isInventoryItemOutWithoutMinimum(item: InventoryItem): boolean {
  return item.isActive && item.quantity <= 0 && !hasMinimum(item);
}
