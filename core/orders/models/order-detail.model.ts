import { User } from "@/core/auth/models/user.model";
import {
  ProductOption,
  getProductOptionAvailableQuantity,
} from "@/core/menu/models/product-optionl.model";
import { Product, ProductStatus } from "@/core/menu/models/product.model";
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

export enum OrderDetailDeleteBlockReason {
  BILLED = "BILLED",
  DELIVERED = "DELIVERED",
}

/**
 * An item can be deleted only while none of it is on a bill (paid or not) or
 * delivered. Returns why it can't, or null when it can.
 */
export const getOrderDetailDeleteBlockReason = (
  detail: OrderDetail,
): OrderDetailDeleteBlockReason | null => {
  // qtyPaid counts units added to a bill, whether or not it's been paid yet.
  if (detail.qtyPaid > 0) return OrderDetailDeleteBlockReason.BILLED;
  if (detail.qtyDelivered > 0) return OrderDetailDeleteBlockReason.DELIVERED;
  return null;
};

/**
 * Once any unit of an item has been delivered, its variant/option is locked —
 * changing it would misrepresent what was already handed to the customer.
 */
export const canChangeVariant = (detail: OrderDetail): boolean =>
  detail.qtyDelivered === 0;

export enum AddAgainBlockReason {
  NOT_IN_MENU = "NOT_IN_MENU",
  UNAVAILABLE = "UNAVAILABLE",
  NO_STOCK = "NO_STOCK",
}

/**
 * A cancelled item can be added again as a new line only if its product and
 * variant are still on the menu and available. With orders without stock
 * blocked, the ingredients left must also cover its quantity (the server
 * checks the same). `menuProduct` is the product as it is on the menu now.
 */
export const getAddAgainBlockReason = (
  detail: OrderDetail,
  menuProduct: Product | undefined,
  blocksWithoutStock: boolean,
): { reason: AddAgainBlockReason; remaining?: number } | null => {
  const option = menuProduct?.options.find(
    (o) => o.id === detail.productOption?.id,
  );
  if (!menuProduct || !menuProduct.isActive || !option || !option.isActive)
    return { reason: AddAgainBlockReason.NOT_IN_MENU };
  if (menuProduct.status !== ProductStatus.AVAILABLE)
    return { reason: AddAgainBlockReason.UNAVAILABLE };
  if (blocksWithoutStock) {
    const remaining = getProductOptionAvailableQuantity(option);
    if (remaining !== null && remaining < detail.quantity)
      return { reason: AddAgainBlockReason.NO_STOCK, remaining };
  }
  return null;
};
