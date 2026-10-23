import type {
  InventoryAdjustmentReason,
  InventoryMovementType,
} from "@/core/inventory/models/inventory-movement.model";

export interface AdjustInventoryDto {
  inventoryItemId: string;
  delta: number;
  type: InventoryMovementType;
  note?: string;
  reason?: InventoryAdjustmentReason;
}
