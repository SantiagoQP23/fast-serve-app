import { restaurantApi } from "@/core/api/restaurantApi";
import type { ProductOptionInventoryItem } from "@/core/inventory/models/inventory-recipe.model";
import type { CreateRecipeDto } from "../interfaces/dto/create-recipe.dto";
import type { UpdateRecipeDto } from "../interfaces/dto/update-recipe.dto";

export class InventoryRecipeService {
  static async getByProductOption(
    productOptionId: number,
  ): Promise<ProductOptionInventoryItem[]> {
    const resp = await restaurantApi.get<ProductOptionInventoryItem[]>(
      `/inventory/recipes/by-product-option/${productOptionId}`,
    );
    return resp.data;
  }

  static async getById(id: string): Promise<ProductOptionInventoryItem> {
    const resp = await restaurantApi.get<ProductOptionInventoryItem>(
      `/inventory/recipes/${id}`,
    );
    return resp.data;
  }

  static async create(
    data: CreateRecipeDto,
  ): Promise<ProductOptionInventoryItem> {
    const resp = await restaurantApi.post<ProductOptionInventoryItem>(
      "/inventory/recipes",
      data,
    );
    return resp.data;
  }

  static async update(
    data: UpdateRecipeDto,
  ): Promise<ProductOptionInventoryItem> {
    const { id, ...updateData } = data;
    const resp = await restaurantApi.patch<ProductOptionInventoryItem>(
      `/inventory/recipes/${id}`,
      updateData,
    );
    return resp.data;
  }

  static async remove(id: string): Promise<void> {
    await restaurantApi.delete(`/inventory/recipes/${id}`);
  }
}
