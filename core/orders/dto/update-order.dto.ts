import { OrderType } from "../enums/order-type.enum";

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
