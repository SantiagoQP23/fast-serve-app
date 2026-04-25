import { ProductOption } from "@/core/menu/models/product-optionl.model";
import { Product } from "@/core/menu/models/product.model";

export interface NewOrderDetail {
  id?: string;
  quantity: number;
  product: Product;
  description?: string;
  price?: number;
  tagIds?: string[];
  productOption: ProductOption;
}
