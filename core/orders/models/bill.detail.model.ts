import { Bill } from "./bill.model";
import { OrderDetail } from "./order-detail.model";

export interface BillDetail {
  id: number;
  quantity: number;
  price: number;
  total: number;
  bill: Bill;
  orderDetail: OrderDetail;
  createdAt: Date;
  updatedAt: Date;
}
