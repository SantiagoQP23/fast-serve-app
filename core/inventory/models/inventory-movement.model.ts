export enum InventoryMovementType {
  MANUAL_RESTOCK = "MANUAL_RESTOCK",
  MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT",
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  delta: number;
  type: string;
  reason?: string | null;
  createdAt: string;
}
