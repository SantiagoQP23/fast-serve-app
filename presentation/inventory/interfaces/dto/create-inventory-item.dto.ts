import type { InventoryUnit } from "@/core/inventory/models/inventory-item.model";

export interface CreateInventoryItemDto {
  name: string;
  unit: InventoryUnit;
  quantity?: number;
  minimumQuantity?: number;
  isActive?: boolean;
  categoryId?: string | null;
}
