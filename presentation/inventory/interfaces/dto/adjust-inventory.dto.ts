import type { InventoryMovementType } from "@/core/inventory/models/inventory-movement.model";

export interface AdjustInventoryDto {
  inventoryItemId: string;
  delta: number;
  type: InventoryMovementType;
  reason?: string;
}
