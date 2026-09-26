import { restaurantApi } from "@/core/api/restaurantApi";
import type { ProductOption } from "@/core/menu/models/product-optionl.model";
import type { CreateProductOptionDto } from "../interfaces/dto/create-product-option.dto";

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
}
