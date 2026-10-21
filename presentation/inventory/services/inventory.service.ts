import { restaurantApi } from "@/core/api/restaurantApi";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";
import type { InventoryMovement } from "@/core/inventory/models/inventory-movement.model";
import type { ProductOptionInventoryItem } from "@/core/inventory/models/inventory-recipe.model";
import type { CreateInventoryItemDto } from "../interfaces/dto/create-inventory-item.dto";
import type { UpdateInventoryItemDto } from "../interfaces/dto/update-inventory-item.dto";
import type { AdjustInventoryDto } from "../interfaces/dto/adjust-inventory.dto";
import type { LinkProductOptionsDto } from "../interfaces/dto/link-product-option.dto";
import type { FindAllInventoryItemsDto } from "../interfaces/dto/find-all-inventory-items.dto";

export interface InventoryItemsPage {
  items: InventoryItem[];
  count: number;
}

export interface InventoryStockSummaryCounts {
  critical: number;
  low: number;
  optimal: number;
  /** In stock with no minimum set — outside the three health buckets. */
  noMinimum?: number;
}

export class InventoryService {
  static async getAll(
    filters: FindAllInventoryItemsDto = {},
  ): Promise<InventoryItemsPage> {
    const resp = await restaurantApi.get<InventoryItemsPage>(
      "/inventory/items",
      { params: filters },
    );
    return resp.data;
  }

  static async getStockSummary(
    filters: Pick<
      FindAllInventoryItemsDto,
      "categoryId" | "uncategorized"
    > = {},
  ): Promise<InventoryStockSummaryCounts> {
    const resp = await restaurantApi.get<InventoryStockSummaryCounts>(
      "/inventory/items/summary",
      { params: filters },
    );
    return resp.data;
  }

  static async getById(id: string): Promise<InventoryItem> {
    const resp = await restaurantApi.get<InventoryItem>(
      `/inventory/items/${id}`,
    );
    return resp.data;
  }

  static async create(data: CreateInventoryItemDto): Promise<InventoryItem> {
    const resp = await restaurantApi.post<InventoryItem>(
      "/inventory/items",
      data,
    );
    return resp.data;
  }

  static async update(data: UpdateInventoryItemDto): Promise<InventoryItem> {
    const { id, ...updateData } = data;
    const resp = await restaurantApi.patch<InventoryItem>(
      `/inventory/items/${id}`,
      updateData,
    );
    return resp.data;
  }

  static async remove(id: string): Promise<void> {
    await restaurantApi.delete(`/inventory/items/${id}`);
  }

  static async bulkRemove(ids: string[]): Promise<void> {
    await restaurantApi.post("/inventory/items/bulk-delete", { ids });
  }

  static async bulkMoveCategory(
    ids: string[],
    categoryId: string | null,
  ): Promise<void> {
    await restaurantApi.post("/inventory/items/bulk-move-category", {
      ids,
      categoryId,
    });
  }

  /** Links the item to several variants at once; all or nothing. */
  static async linkProductOptions(
    itemId: string,
    data: LinkProductOptionsDto,
  ): Promise<ProductOptionInventoryItem[]> {
    const resp = await restaurantApi.post<ProductOptionInventoryItem[]>(
      `/inventory/items/${itemId}/recipe-lines/bulk`,
      data,
    );
    return resp.data;
  }

  static async adjust(data: AdjustInventoryDto): Promise<InventoryMovement> {
    const resp = await restaurantApi.post<InventoryMovement>(
      "/inventory/movements/adjust",
      data,
    );
    return resp.data;
  }

  static async getMovementsByItem(
    inventoryItemId: string,
  ): Promise<InventoryMovement[]> {
    const resp = await restaurantApi.get<InventoryMovement[]>(
      `/inventory/movements/by-item/${inventoryItemId}`,
    );
    return resp.data;
  }

  static async getMovements(): Promise<InventoryMovement[]> {
    const resp = await restaurantApi.get<InventoryMovement[]>(
      "/inventory/movements",
    );
    return resp.data;
  }
}
