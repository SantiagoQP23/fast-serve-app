import { restaurantApi } from "@/core/api/restaurantApi";
import type {
  InventoryCount,
  InventoryCountAnswer,
} from "@/core/inventory/models/inventory-count.model";

export interface InventoryCountsPage {
  counts: InventoryCount[];
  count: number;
}

export class InventoryCountService {
  static async getAll(params: {
    limit?: number;
    offset?: number;
  }): Promise<InventoryCountsPage> {
    const resp = await restaurantApi.get<InventoryCountsPage>(
      "/inventory/counts",
      { params },
    );
    return resp.data;
  }

  static async getById(id: string): Promise<InventoryCount> {
    const resp = await restaurantApi.get<InventoryCount>(
      `/inventory/counts/${id}`,
    );
    return resp.data;
  }

  static async create(data: {
    inventoryItemIds: string[];
    idempotencyKey: string;
  }): Promise<InventoryCount> {
    const resp = await restaurantApi.post<InventoryCount>(
      "/inventory/counts",
      data,
    );
    return resp.data;
  }

  static async addItems(
    countId: string,
    inventoryItemIds: string[],
  ): Promise<InventoryCount> {
    const resp = await restaurantApi.post<InventoryCount>(
      `/inventory/counts/${countId}/items`,
      { inventoryItemIds },
    );
    return resp.data;
  }

  static async answerItem(
    countId: string,
    itemId: string,
    answer: InventoryCountAnswer,
    countedQuantity?: number,
  ): Promise<InventoryCount> {
    const resp = await restaurantApi.patch<InventoryCount>(
      `/inventory/counts/${countId}/items/${itemId}`,
      { answer, countedQuantity },
    );
    return resp.data;
  }

  static async complete(countId: string): Promise<InventoryCount> {
    const resp = await restaurantApi.post<InventoryCount>(
      `/inventory/counts/${countId}/complete`,
    );
    return resp.data;
  }
}
