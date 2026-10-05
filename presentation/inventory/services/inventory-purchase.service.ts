import { restaurantApi } from "@/core/api/restaurantApi";
import type { InventoryPurchase } from "@/core/inventory/models/inventory-purchase.model";
import type { CreateInventoryPurchaseDto } from "../interfaces/dto/create-inventory-purchase.dto";

export interface InventoryPurchasesPage {
  purchases: InventoryPurchase[];
  count: number;
}

export class InventoryPurchaseService {
  static async getAll(params: {
    limit?: number;
    offset?: number;
  }): Promise<InventoryPurchasesPage> {
    const resp = await restaurantApi.get<InventoryPurchasesPage>(
      "/inventory/purchases",
      { params },
    );
    return resp.data;
  }

  static async getById(id: string): Promise<InventoryPurchase> {
    const resp = await restaurantApi.get<InventoryPurchase>(
      `/inventory/purchases/${id}`,
    );
    return resp.data;
  }

  static async create(
    data: CreateInventoryPurchaseDto,
  ): Promise<InventoryPurchase> {
    const resp = await restaurantApi.post<InventoryPurchase>(
      "/inventory/purchases",
      data,
    );
    return resp.data;
  }

  static async updateItem(
    purchaseId: string,
    itemId: string,
    quantity: number,
  ): Promise<InventoryPurchase> {
    const resp = await restaurantApi.patch<InventoryPurchase>(
      `/inventory/purchases/${purchaseId}/items/${itemId}`,
      { quantity },
    );
    return resp.data;
  }

  static async removeItem(
    purchaseId: string,
    itemId: string,
  ): Promise<InventoryPurchase> {
    const resp = await restaurantApi.delete<InventoryPurchase>(
      `/inventory/purchases/${purchaseId}/items/${itemId}`,
    );
    return resp.data;
  }
}
