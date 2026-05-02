import { User } from "@/core/auth/models/user.model";
import { ProductOption } from "@/core/menu/models/product-optionl.model";
import { Product } from "@/core/menu/models/product.model";
import { Tag } from "@/core/menu/models/tag.model";

export enum OrderDetailStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  READY = "READY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export interface OrderDetail {
  id: string;

  quantity: number;

  qtyDelivered: number;
  readyQuantity: number;

  status: OrderDetailStatus;

  qtyPaid: number;

  amount: number;

  description: string;

  createdAt: string;

  updatedAt: string;

  product: Product;

  isActive: boolean;
  price: number;
  tags: Tag[];
  createdBy?: User;
  updatedBy?: User;

  // typeOrderDetail: TypeOrder;
  productOption?: ProductOption;
}
