import type { InventoryUnit } from "@/core/inventory/models/inventory-item.model";

export interface CreateInventoryItemDto {
  name: string;
  unit: InventoryUnit;
  quantity?: number;
  quantityPerUnit: number;
  minStock?: number;
  unitCost?: number;
  trackStock?: boolean;
  productOptionId: number;
}
