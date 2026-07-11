import { ProductOption } from "@/core/menu/models/product-optionl.model";
import { Product } from "@/core/menu/models/product.model";
import { OrderType } from "@/core/orders/enums/order-type.enum";

export interface NewOrderDetail {
  id?: string;
  quantity: number;
  product: Product;
  description?: string;
  price?: number;
  tagIds?: string[];
  productOption: ProductOption;
  typeOrderDetail?: OrderType;
}
