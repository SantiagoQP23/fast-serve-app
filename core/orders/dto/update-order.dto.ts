import { OrderType } from "../enums/order-type.enum";

export interface UpdateOrderDto {
  id: string;
  tableId?: string;
  clientId?: string;
  userId?: string;
  people?: number;
  status?: string;
  discount?: number;
  typeOrder?: OrderType;
  isPaid?: boolean;
  notes?: string;
  deliveryTime?: Date;
  isClosed?: boolean;
}

export interface UpdateOrderDetailDto {
  id: string;
  quantity?: number;
  qtyDelivered?: number;
  description?: string;
  orderId: string;
  price?: number;
  productOptionId?: number;
  typeOrderDetail?: OrderType;
}

export interface AddOrderDetailToOrderDto {
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  description?: string;
  productOptionId?: number;
}
