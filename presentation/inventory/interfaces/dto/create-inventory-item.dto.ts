import type { InventoryUnit } from "@/core/inventory/models/inventory-item.model";

export interface CreateInventoryItemRecipeLineDto {
  productOptionId: number;
  quantity: number;
}

export interface CreateInventoryItemDto {
  name: string;
  unit: InventoryUnit;
  quantity?: number;
  minimumQuantity?: number;
  isActive?: boolean;
  categoryId?: string | null;
  /** Product options to link to this item, created alongside it. */
  recipeLines?: CreateInventoryItemRecipeLineDto[];
}
