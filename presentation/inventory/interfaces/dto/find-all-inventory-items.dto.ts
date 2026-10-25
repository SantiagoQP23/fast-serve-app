import type { InventoryItemKind } from "@/core/inventory/models/inventory-item.model";

export enum InventoryItemStockStatusFilter {
  CRITICAL = "CRITICAL",
  LOW = "LOW",
  OPTIMAL = "OPTIMAL",
  NO_MINIMUM = "NO_MINIMUM",
}

export interface FindAllInventoryItemsDto {
  categoryId?: string;
  uncategorized?: boolean;
  status?: InventoryItemStockStatusFilter;
  search?: string;
  kind?: InventoryItemKind;
  limit?: number;
  offset?: number;
}
