import type { InventoryItem } from "./inventory-item.model";

export interface InventoryPurchaseItem {
  id: string;
  /** Amount received, in the inventory item's own unit. */
  quantity: number;
  inventoryItem: InventoryItem;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryPurchase {
  id: string;
  note: string | null;
  createdAt: string;
  updatedAt?: string;
  createdBy?: {
    id: string;
    username?: string;
    person?: { firstName?: string; lastName?: string } | null;
  } | null;
  /** Only present on the detail endpoint. */
  items?: InventoryPurchaseItem[];
  /** Only present on the list endpoint. */
  itemsCount?: number;
}

export function getPurchaseCreatorName(
  purchase: InventoryPurchase,
): string | null {
  const person = purchase.createdBy?.person;
  const fullName = [person?.firstName, person?.lastName]
    .filter(Boolean)
    .join(" ");
  return fullName || purchase.createdBy?.username || null;
}
