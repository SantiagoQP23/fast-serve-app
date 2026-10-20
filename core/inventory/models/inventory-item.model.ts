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

export type InventoryStockStatus = "critical" | "low" | "optimal" | "inactive";

export function getInventoryStockStatus(
  item: InventoryItem,
): InventoryStockStatus {
  if (!item.isActive) return "inactive";
  if (item.minimumQuantity == null || item.minimumQuantity <= 0) {
    return "optimal";
  }

  const ratioToMinimum = item.quantity / item.minimumQuantity;
  if (item.quantity <= 0 || ratioToMinimum <= 0.5) return "critical";
  if (ratioToMinimum <= 1) return "low";
  return "optimal";
}

/** Fill ratio (0-1) for a stock level bar, relative to the minimum quantity. */
export function getInventoryStockRatio(item: InventoryItem): number {
  if (item.minimumQuantity == null || item.minimumQuantity <= 0) return 1;
  return Math.min(Math.max(item.quantity / item.minimumQuantity, 0), 1);
}

/**
 * Items for the shopping list: active, with a minimum set, and strictly
 * below it — an item sitting exactly at its minimum has nothing to buy.
 */
export function isInventoryItemBelowMinimum(item: InventoryItem): boolean {
  return (
    item.isActive &&
    item.minimumQuantity != null &&
    item.minimumQuantity > 0 &&
    item.quantity < item.minimumQuantity
  );
}

/**
 * Amount needed to get back to the minimum, rounded up (whole units for
 * UNIT, 2 decimals otherwise). 0 when the item is already at the minimum.
 */
export function getSuggestedPurchaseQuantity(item: InventoryItem): number {
  if (item.minimumQuantity == null || item.minimumQuantity <= 0) return 0;
  const missing = item.minimumQuantity - item.quantity;
  if (missing <= 0) return 0;
  if (item.unit === InventoryUnit.UNIT) return Math.ceil(missing - 1e-9);
  return Math.ceil(missing * 100 - 1e-6) / 100;
}
