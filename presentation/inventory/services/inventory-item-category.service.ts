import { restaurantApi } from "@/core/api/restaurantApi";
import type { InventoryItemCategory } from "@/core/inventory/models/inventory-item-category.model";
import type { CreateInventoryItemCategoryDto } from "../interfaces/dto/create-inventory-item-category.dto";
import type { UpdateInventoryItemCategoryDto } from "../interfaces/dto/update-inventory-item-category.dto";

export class InventoryItemCategoryService {
  static async getAll(): Promise<InventoryItemCategory[]> {
    const resp = await restaurantApi.get<InventoryItemCategory[]>(
      "/inventory/categories",
    );
    return resp.data;
  }

  static async getById(id: string): Promise<InventoryItemCategory> {
    const resp = await restaurantApi.get<InventoryItemCategory>(
      `/inventory/categories/${id}`,
    );
    return resp.data;
  }

  static async create(
    data: CreateInventoryItemCategoryDto,
  ): Promise<InventoryItemCategory> {
    const resp = await restaurantApi.post<InventoryItemCategory>(
      "/inventory/categories",
      data,
    );
    return resp.data;
  }

  static async update(
    data: UpdateInventoryItemCategoryDto,
  ): Promise<InventoryItemCategory> {
    const { id, ...updateData } = data;
    const resp = await restaurantApi.patch<InventoryItemCategory>(
      `/inventory/categories/${id}`,
      updateData,
    );
    return resp.data;
  }

  static async remove(id: string): Promise<void> {
    await restaurantApi.delete(`/inventory/categories/${id}`);
  }
}
