import type { ProductOptionInventoryItem } from "@/core/inventory/models/inventory-recipe.model";

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
