import { Table } from "@/core/tables/models/table.model";
import { OrderDetail } from "./order-detail.model";
import { User } from "@/core/auth/models/user.model";
import { OrderStatus } from "../enums/order-status.enum";
import { OrderType } from "../enums/order-type.enum";
import { OrderPaymentStatus } from "../enums/order-payment-status.enum";

export interface Order {
  notes: string;
  deliveryTime: Date;
  createdAt: Date;
  details: OrderDetail[];
  id: string;
  isPaid: boolean;
  num: number;
  people: number;
  status: OrderStatus;
  table?: Table;
  total: number;
  type: OrderType;
  updatedAt: Date;
  user: User;
  isClosed: boolean;
  paymentStatus: OrderPaymentStatus;
  // bills: Bill[];
}
