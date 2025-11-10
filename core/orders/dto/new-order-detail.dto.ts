import { Product } from "@/core/menu/models/product.model";

export interface NewOrderDetail {
  quantity: number;
  product: Product;
  description?: string;
  // productOption?: ProductOption;
}
