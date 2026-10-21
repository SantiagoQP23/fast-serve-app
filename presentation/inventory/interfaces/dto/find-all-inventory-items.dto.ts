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
  limit?: number;
  offset?: number;
}
