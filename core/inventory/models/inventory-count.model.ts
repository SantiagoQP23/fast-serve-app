import type { InventoryItem } from "./inventory-item.model";

export enum InventoryCountStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export enum InventoryCountItemStatus {
  PENDING = "PENDING",
  MATCHED = "MATCHED",
  ADJUSTED = "ADJUSTED",
  SKIPPED = "SKIPPED",
}

export enum InventoryCountAnswer {
  MATCH = "MATCH",
  ADJUST = "ADJUST",
  SKIP = "SKIP",
}

interface InventoryCountUser {
  id: string;
  username?: string;
  person?: { firstName?: string; lastName?: string } | null;
}

export interface InventoryCountItem {
  id: string;
  position: number;
  status: InventoryCountItemStatus;
  /** Stock the system had, without this count's correction. Null until answered. */
  expectedQuantity: number | null;
  countedQuantity: number | null;
  /** countedQuantity − expectedQuantity: the net correction this line applied. */
  difference: number | null;
  countedAt: string | null;
  /** Current item, so `quantity` is today's stock. */
  inventoryItem: InventoryItem;
}

export interface InventoryCount {
  id: string;
  status: InventoryCountStatus;
  note: string | null;
  createdAt: string;
  completedAt: string | null;
  createdBy?: InventoryCountUser | null;
  completedBy?: InventoryCountUser | null;
  /** Only present on the detail endpoint, in counting order. */
  items?: InventoryCountItem[];
  /** Only present on the list endpoint. */
  itemsCount?: number;
  adjustedCount?: number;
  /** Lines not answered yet (pending or skipped). */
  pendingCount?: number;
}

export function getCountUserName(
  user?: InventoryCountUser | null,
): string | null {
  const fullName = [user?.person?.firstName, user?.person?.lastName]
    .filter(Boolean)
    .join(" ");
  return fullName || user?.username || null;
}

export function isCountItemAnswered(item: InventoryCountItem): boolean {
  return (
    item.status === InventoryCountItemStatus.MATCHED ||
    item.status === InventoryCountItemStatus.ADJUSTED
  );
}
