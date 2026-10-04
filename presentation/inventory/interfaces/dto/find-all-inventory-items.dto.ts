export enum InventoryItemStockStatusFilter {
  CRITICAL = "CRITICAL",
  LOW = "LOW",
  OPTIMAL = "OPTIMAL",
}

export interface FindAllInventoryItemsDto {
  categoryId?: string;
  status?: InventoryItemStockStatusFilter;
  limit?: number;
  offset?: number;
}
