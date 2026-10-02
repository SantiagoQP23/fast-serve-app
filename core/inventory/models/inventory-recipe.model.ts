import type { InventoryItem } from "./inventory-item.model";

export interface ProductOptionInventoryItem {
  id: string;
  productOptionId: number;
  inventoryItemId: string;
  quantity: number;
  createdAt?: string;
  updatedAt?: string;
  inventoryItem?: InventoryItem;
  productOption?: {
    id: number;
    name: string;
    product?: { id: string; name: string };
  };
}
