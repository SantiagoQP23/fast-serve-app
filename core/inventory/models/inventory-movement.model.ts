export enum InventoryMovementType {
  // Kept for historical movements only — consumption now happens at order
  // creation (see ORDER_CREATED), not at delivery.
  ORDER_DELIVERED = "ORDER_DELIVERED",
  ORDER_DELIVERY_REVERSED = "ORDER_DELIVERY_REVERSED",
  ORDER_CREATED = "ORDER_CREATED",
  ORDER_CREATED_REVERSED = "ORDER_CREATED_REVERSED",
  SALE_DIRECT = "SALE_DIRECT",
  SALE_DIRECT_CANCELLED = "SALE_DIRECT_CANCELLED",
  MANUAL_RESTOCK = "MANUAL_RESTOCK",
  MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT",
  PURCHASE = "PURCHASE",
  PURCHASE_REVERSED = "PURCHASE_REVERSED",
  INVENTORY_COUNT_INCREASE = "INVENTORY_COUNT_INCREASE",
  INVENTORY_COUNT_DECREASE = "INVENTORY_COUNT_DECREASE",
}

export enum InventoryMovementSourceType {
  ORDER_DETAIL = "ORDER_DETAIL",
  BILL_DETAIL = "BILL_DETAIL",
  MANUAL = "MANUAL",
  PURCHASE = "PURCHASE",
  INVENTORY_COUNT = "INVENTORY_COUNT",
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

export interface DailyConsumption {
  /** ISO date (yyyy-mm-dd), UTC. */
  date: string;
  total: number;
}

/** Consumption (sum of negative-delta movements) per day for the trailing 7 days, oldest first. */
export function getWeeklyConsumption(
  movements: InventoryMovement[],
): DailyConsumption[] {
  const days: DailyConsumption[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push({ date: date.toISOString().slice(0, 10), total: 0 });
  }

  const byDate = new Map(days.map((day) => [day.date, day]));

  for (const movement of movements) {
    if (movement.quantity >= 0) continue;
    const bucket = byDate.get(movement.createdAt.slice(0, 10));
    if (bucket) bucket.total += Math.abs(movement.quantity);
  }

  return days;
}
