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
