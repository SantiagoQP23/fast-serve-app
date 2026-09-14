import { restaurantApi } from "@/core/api/restaurantApi";
import type { Product } from "@/core/menu/models/product.model";
import type { CreateProductDto } from "../interfaces/dto/create-product.dto";
import type { UpdateProductDto } from "../interfaces/dto/update-product.dto";

export class ProductsService {
  static async create(data: CreateProductDto): Promise<Product> {
    const resp = await restaurantApi.post<Product>("/products", data);
    return resp.data;
  }

  static async update(data: UpdateProductDto): Promise<Product> {
    const { id, ...updateData } = data;
    const resp = await restaurantApi.patch<Product>(
      `/products/${id}`,
      updateData,
    );
    return resp.data;
  }

  static async remove(id: string): Promise<void> {
    await restaurantApi.delete(`/products/${id}`);
  }
}
