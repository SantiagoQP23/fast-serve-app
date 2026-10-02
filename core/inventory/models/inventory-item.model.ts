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
