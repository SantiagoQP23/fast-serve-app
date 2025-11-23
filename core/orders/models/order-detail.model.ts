import { Product } from "@/core/menu/models/product.model";

export interface OrderDetail {
  id: string;

  quantity: number;

  qtyDelivered: number;

  qtyPaid: number;

  amount: number;

  description: string;

  createdAt: string;

  updatedAt: string;

  product: Product;

  isActive: boolean;

  price: number;

  // typeOrderDetail: TypeOrder;
  // productOption?: ProductOption;
}
