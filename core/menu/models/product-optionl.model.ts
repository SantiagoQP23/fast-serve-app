import {
  getOwnStockLine,
  type ProductOptionInventoryItem,
} from "@/core/inventory/models/inventory-recipe.model";

export interface ProductOption {
  id: number;
  name: string;
  price: number;
  cost?: number;
  isActive: boolean;
  isAvailable: boolean;
  isDefault: boolean;
  trackStock: boolean;
  quantity: number;
  inventoryItems?: ProductOptionInventoryItem[];
}

/**
 * Units of this option still deliverable given its linked inventory items'
 * current stock (the limiting ingredient across all recipe lines).
 * Returns null when the option has no linked inventory item.
 */
export function getProductOptionAvailableQuantity(
  option: ProductOption,
): number | null {
  if (!option.inventoryItems || option.inventoryItems.length === 0) {
    return null;
  }

  return Math.min(
    ...option.inventoryItems.map((line) =>
      line.inventoryItem && line.quantity > 0
        ? Math.floor(line.inventoryItem.quantity / line.quantity)
        : 0,
    ),
  );
}

export type ProductOptionStockLevel = "out" | "low" | "ok";

/**
 * Stock level of this option given how many units are still available:
 * "out" when none can be made, "low" when any linked inventory item is at or
 * under its minimum, "ok" otherwise. Returns null when the option is not
 * linked to inventory.
 */
export function getProductOptionStockLevel(
  option: ProductOption,
  available: number | null = getProductOptionAvailableQuantity(option),
): ProductOptionStockLevel | null {
  if (available === null) return null;
  if (available <= 0) return "out";

  const isLow = (option.inventoryItems ?? []).some(({ inventoryItem }) =>
    inventoryItem?.minimumQuantity != null && inventoryItem.minimumQuantity > 0
      ? inventoryItem.quantity <= inventoryItem.minimumQuantity
      : false,
  );

  return isLow ? "low" : "ok";
}

export type VariantStockMode = "own" | "recipe" | "none";

/**
 * How a variant tracks stock: its own units (one 1-unit line to a PRODUCT
 * item), a recipe of insumos, or not at all.
 */
export function getVariantStockMode(option: ProductOption): VariantStockMode {
  const lines = option.inventoryItems ?? [];
  if (!lines.length) return "none";
  return getOwnStockLine(lines) ? "own" : "recipe";
}

/**
 * The recipe line that runs out first (fewest units it can cover), for
 * "Alcanza para N" explanations. Null without a recipe.
 */
export function getLimitingRecipeLine(
  option: ProductOption,
): ProductOptionInventoryItem | null {
  let limiting: ProductOptionInventoryItem | null = null;
  let fewest = Infinity;
  for (const line of option.inventoryItems ?? []) {
    const covers =
      line.inventoryItem && line.quantity > 0
        ? Math.floor(line.inventoryItem.quantity / line.quantity)
        : 0;
    if (covers < fewest) {
      fewest = covers;
      limiting = line;
    }
  }
  return limiting;
}
