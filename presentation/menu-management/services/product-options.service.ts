import { restaurantApi } from "@/core/api/restaurantApi";
import type { ProductOption } from "@/core/menu/models/product-optionl.model";
import type { CreateProductOptionDto } from "../interfaces/dto/create-product-option.dto";
import type { UpdateProductOptionDto } from "../interfaces/dto/update-product-option.dto";

export interface CreatedProductOption extends ProductOption {
  productId: string;
  order?: number;
}

export class ProductOptionsService {
  static async create(
    data: CreateProductOptionDto,
  ): Promise<CreatedProductOption> {
    const resp = await restaurantApi.post<CreatedProductOption>(
      "/product-options",
      data,
    );
    return resp.data;
  }

  static async update(
    id: number,
    data: UpdateProductOptionDto,
  ): Promise<CreatedProductOption> {
    const resp = await restaurantApi.patch<CreatedProductOption>(
      `/product-options/${id}`,
      data,
    );
    return resp.data;
  }

  static async remove(id: number): Promise<void> {
    await restaurantApi.delete(`/product-options/${id}`);
  }
}
