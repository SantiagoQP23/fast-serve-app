import { restaurantApi } from "@/core/api/restaurantApi";
import type { ProductOptionInventoryItem } from "@/core/inventory/models/inventory-recipe.model";

export interface EnableVariantStockDto {
  /** Units on hand right now; recorded as a restock. */
  quantity?: number;
  minimumQuantity?: number | null;
}

/** The variant as the variant-stock endpoints answer it. */
export interface VariantStockResponse {
  id: number;
  inventoryItems: ProductOptionInventoryItem[];
}

/** How a menu variant tracks stock (own units, recipe or nothing). */
export class VariantStockService {
  static async enable(
    productOptionId: number,
    data: EnableVariantStockDto = {},
  ): Promise<VariantStockResponse> {
    const resp = await restaurantApi.post<VariantStockResponse>(
      `/inventory/variant-stock/${productOptionId}`,
      data,
    );
    return resp.data;
  }

  /** Removes the variant's own stock or recipe. */
  static async disable(productOptionId: number): Promise<VariantStockResponse> {
    const resp = await restaurantApi.delete<VariantStockResponse>(
      `/inventory/variant-stock/${productOptionId}`,
    );
    return resp.data;
  }

  /** Shared stock becomes this variant's own, starting at 0. */
  static async separate(
    productOptionId: number,
  ): Promise<VariantStockResponse> {
    const resp = await restaurantApi.post<VariantStockResponse>(
      `/inventory/variant-stock/${productOptionId}/separate`,
    );
    return resp.data;
  }

  /** The variant's own stock moves to the insumos (kept as its recipe). */
  static async convertToIngredient(
    productOptionId: number,
  ): Promise<VariantStockResponse> {
    const resp = await restaurantApi.post<VariantStockResponse>(
      `/inventory/variant-stock/${productOptionId}/to-ingredient`,
    );
    return resp.data;
  }
}
