import type { LineCustomizationPayload } from "@/core/menu/models/customization.model";
import { OrderType } from "../enums/order-type.enum";

export interface CreateOrderDto {
  idempotencyKey?: string;
  clientId?: string;
  tableId?: string;
  details: CreateOrderDetailDto[];
  people: number;
  typeOrder: OrderType;
  notes?: string;
  deliveryTime?: Date;
}

export interface CreateOrderDetailDto {
  productId: string;
  quantity: number;
  description?: string;
  price?: number;
  productOptionId: number;
  typeOrderDetail: OrderType;
  tagIds?: string[];
  /** Picks and removals; the server checks them and sets the price. */
  customization?: LineCustomizationPayload;
}
