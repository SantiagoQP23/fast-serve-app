import { restaurantApi } from "@/core/api/restaurantApi";
import type { Product } from "@/core/menu/models/product.model";
import type { ModifierGroup } from "@/core/menu/models/customization.model";

export interface SaveModifierInput {
  /** Existing option; left out for a new one. */
  id?: string;
  name: string;
  priceDelta: number;
  isActive?: boolean;
  isDefault?: boolean;
  inventoryItemId?: string | null;
  inventoryQuantity?: number | null;
}

/** The whole group; options left out of `modifiers` are deleted. */
export interface SaveModifierGroupInput {
  name: string;
  description?: string;
  minSelect: number;
  /** Null: no limit. */
  maxSelect: number | null;
  isActive?: boolean;
  modifiers: SaveModifierInput[];
  /** Every product that uses the group; left out keeps the links. */
  productIds?: string[];
}

export interface SaveProductComponentInput {
  id?: string;
  name: string;
  removable: boolean;
  /** Zero or negative. */
  removalPriceDelta: number;
  inventoryItemId?: string | null;
  inventoryQuantity?: number | null;
}

/** The product's whole "Personalización"; anything left out is removed. */
export interface SaveProductCustomizationInput {
  components: SaveProductComponentInput[];
  groups: {
    groupId: string;
    minSelect?: number | null;
    maxSelect?: number | null;
  }[];
}

export class ModifierGroupsService {
  static async getAll(): Promise<ModifierGroup[]> {
    const resp = await restaurantApi.get<ModifierGroup[]>("/modifier-groups");
    return resp.data;
  }

  static async create(input: SaveModifierGroupInput): Promise<ModifierGroup> {
    const resp = await restaurantApi.post<ModifierGroup>(
      "/modifier-groups",
      input,
    );
    return resp.data;
  }

  static async update(
    id: string,
    input: SaveModifierGroupInput,
  ): Promise<ModifierGroup> {
    const resp = await restaurantApi.put<ModifierGroup>(
      `/modifier-groups/${id}`,
      input,
    );
    return resp.data;
  }

  static async remove(id: string): Promise<void> {
    await restaurantApi.delete(`/modifier-groups/${id}`);
  }

  /** Saves the product's included items and groups; returns the product. */
  static async saveProductCustomization(
    productId: Product["id"],
    input: SaveProductCustomizationInput,
  ): Promise<Product> {
    const resp = await restaurantApi.put<Product>(
      `/products/${productId}/customization`,
      input,
    );
    return resp.data;
  }
}
