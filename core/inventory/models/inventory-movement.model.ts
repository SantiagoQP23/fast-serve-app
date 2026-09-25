export enum InventoryMovementType {
  ORDER_DELIVERED = "ORDER_DELIVERED",
  ORDER_DELIVERY_REVERSED = "ORDER_DELIVERY_REVERSED",
  SALE_DIRECT = "SALE_DIRECT",
  SALE_DIRECT_CANCELLED = "SALE_DIRECT_CANCELLED",
  MANUAL_RESTOCK = "MANUAL_RESTOCK",
  MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT",
}

export enum InventoryMovementSourceType {
  ORDER_DETAIL = "ORDER_DETAIL",
  BILL_DETAIL = "BILL_DETAIL",
  MANUAL = "MANUAL",
}

export interface InventoryMovement {
  id: string;
  type: InventoryMovementType;
  quantityBefore: number;
  quantity: number;
  quantityAfter: number;
  wentNegative: boolean;
  sourceType: InventoryMovementSourceType;
  sourceId: string | null;
  note: string | null;
  createdAt: string;
  inventoryItem?: { id: string; name: string; unit: string };
  createdBy?: { id: string; firstName?: string; lastName?: string };
}
