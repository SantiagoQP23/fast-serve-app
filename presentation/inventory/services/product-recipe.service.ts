import { restaurantApi } from "@/core/api/restaurantApi";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";

/** One ingredient of a product's recipe, with its amount per variant. */
export interface ProductRecipeLine {
  inventoryItemId: string;
  inventoryItem: InventoryItem;
  removable: boolean;
  /** Zero or negative. */
  removalPriceDelta: number;
  order: number;
  quantities: {
    productOptionId: number;
    /** Null: an unlimited insumo listed without an amount. */
    quantity: number | null;
    lineId?: string;
  }[];
}

/** A product's recipe on every variant (plans/unificar-receta-incluidos.md). */
export interface ProductRecipe {
  productId: string;
  productName: string;
  variants: { id: number; name: string; isActive: boolean }[];
  lines: ProductRecipeLine[];
}

export interface SaveProductRecipeInput {
  lines: {
    inventoryItemId: string;
    removable: boolean;
    removalPriceDelta: number;
    quantities: { productOptionId: number; quantity: number | null }[];
  }[];
}

export class ProductRecipeService {
  static async get(productId: string): Promise<ProductRecipe> {
    const resp = await restaurantApi.get<ProductRecipe>(
      `/products/${productId}/recipe`,
    );
    return resp.data;
  }

  /** Replaces the whole recipe, every variant at once. */
  static async save(
    productId: string,
    input: SaveProductRecipeInput,
  ): Promise<ProductRecipe> {
    const resp = await restaurantApi.put<ProductRecipe>(
      `/products/${productId}/recipe`,
      input,
    );
    return resp.data;
  }
}
