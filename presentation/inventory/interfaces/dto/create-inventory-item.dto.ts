import type { InventoryUnit } from "@/core/inventory/models/inventory-item.model";

export interface CreateInventoryItemDto {
  name: string;
  unit: InventoryUnit;
  quantity?: number;
  minimumQuantity?: number;
  isActive?: boolean;
  categoryId?: string | null;
  /** Product options consuming this item, linked in the same request. */
  recipeLines?: { productOptionId: number; quantity: number }[];
  /** Without categoryId, use the first recipe line's product category. */
  useProductCategory?: boolean;
}
