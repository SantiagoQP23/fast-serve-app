import { Order } from "../models/order.model";

export interface OrderHistoryRespDto {
  orders: Order[];
  count?: number;
  totalAmount: number;
}
