import type { InventoryItemKind } from "@/core/inventory/models/inventory-item.model";

export enum InventoryItemStockStatusFilter {
  CRITICAL = "CRITICAL",
  LOW = "LOW",
  OPTIMAL = "OPTIMAL",
  NO_MINIMUM = "NO_MINIMUM",
  /** App-side only: sent as `unlimited: true`, not as a status. */
  UNLIMITED = "UNLIMITED",
}

export interface FindAllInventoryItemsDto {
  categoryId?: string;
  uncategorized?: boolean;
  status?: Exclude<
    InventoryItemStockStatusFilter,
    InventoryItemStockStatusFilter.UNLIMITED
  >;
  /** true: only unlimited insumos; false: only counted ones. */
  unlimited?: boolean;
  search?: string;
  kind?: InventoryItemKind;
  limit?: number;
  offset?: number;
}
