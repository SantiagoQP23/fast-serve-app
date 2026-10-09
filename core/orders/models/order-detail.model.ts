import { User } from "@/core/auth/models/user.model";
import { ProductOption } from "@/core/menu/models/product-optionl.model";
import { Product } from "@/core/menu/models/product.model";
import { Tag } from "@/core/menu/models/tag.model";
import { OrderType } from "../enums/order-type.enum";

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
  typeOrderDetail: OrderType;

  // typeOrderDetail: TypeOrder;
  productOption?: ProductOption;
}

export enum ReplaceBlockReason {
  PAID = "PAID",
  DELIVERED = "DELIVERED",
  READY = "READY",
  NOT_PENDING = "NOT_PENDING",
}

/**
 * An item can be swapped for another product only while the kitchen
 * hasn't touched it and nobody has paid for it. The backend enforces the
 * same rule. Returns the reason it can't be replaced, or null when it can.
 */
export const getReplaceBlockReason = (
  detail: OrderDetail,
): ReplaceBlockReason | null => {
  if (detail.qtyPaid > 0) return ReplaceBlockReason.PAID;
  if (detail.qtyDelivered > 0) return ReplaceBlockReason.DELIVERED;
  if (detail.readyQuantity > 0) return ReplaceBlockReason.READY;
  if (detail.status !== OrderDetailStatus.PENDING)
    return ReplaceBlockReason.NOT_PENDING;
  return null;
};

export const canReplaceOrderDetail = (detail: OrderDetail): boolean =>
  getReplaceBlockReason(detail) === null;

/**
 * Once any unit of an item has been delivered, its variant/option is locked —
 * changing it would misrepresent what was already handed to the customer.
 */
export const canChangeVariant = (detail: OrderDetail): boolean =>
  detail.qtyDelivered === 0;
