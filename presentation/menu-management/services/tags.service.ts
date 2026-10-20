import { restaurantApi } from "@/core/api/restaurantApi";
import type { Product } from "@/core/menu/models/product.model";
import type { Tag, TagWithProducts } from "@/core/menu/models/tag.model";

export class TagsService {
  static async getAll(): Promise<TagWithProducts[]> {
    const resp = await restaurantApi.get<TagWithProducts[]>("/tags");
    return resp.data;
  }

  static async create(name: string): Promise<Tag> {
    const resp = await restaurantApi.post<Tag>("/tags", { name });
    return resp.data;
  }

  static async rename(id: string, name: string): Promise<Tag> {
    const resp = await restaurantApi.patch<Tag>(`/tags/${id}`, { name });
    return resp.data;
  }

  static async remove(id: string): Promise<void> {
    await restaurantApi.delete(`/tags/${id}`);
  }

  /** Puts the tag on exactly these products. */
  static async setProducts(
    id: string,
    productIds: string[],
  ): Promise<TagWithProducts> {
    const resp = await restaurantApi.put<TagWithProducts>(
      `/tags/${id}/products`,
      { productIds },
    );
    return resp.data;
  }

  /** Gives the product exactly these tags; returns them A-Z. */
  static async setProductTags(
    productId: Product["id"],
    tagIds: string[],
  ): Promise<Tag[]> {
    const resp = await restaurantApi.put<Tag[]>(`/products/${productId}/tags`, {
      tagIds,
    });
    return resp.data;
  }
}
