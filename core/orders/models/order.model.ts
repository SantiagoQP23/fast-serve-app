import { Table } from "@/core/tables/models/table.model";
import { OrderDetail } from "./order-detail.model";
import { User } from "@/core/auth/models/user.model";
import { OrderStatus } from "../enums/order-status.enum";
import { OrderType } from "../enums/order-type.enum";
import { OrderPaymentStatus } from "../enums/order-payment-status.enum";
import { Bill } from "./bill.model";
import { Ticket } from "@/core/tickets/models/ticket.model";

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
  user?: User;
  isClosed: boolean;
  paymentStatus: OrderPaymentStatus;
  bills: Bill[];
  tickets?: Ticket[];
}

export enum OrderDeleteBlockReason {
  DELIVERED = "DELIVERED",
  NOT_PENDING = "NOT_PENDING",
}

/**
 * Only a pending order with nothing handed out yet can be deleted; the
 * backend enforces the same rule. Returns why it can't, or null when it can.
 */
export const getOrderDeleteBlockReason = (
  order: Order,
): OrderDeleteBlockReason | null => {
  if ((order.details ?? []).some((detail) => detail.qtyDelivered > 0))
    return OrderDeleteBlockReason.DELIVERED;
  if (order.status !== OrderStatus.PENDING)
    return OrderDeleteBlockReason.NOT_PENDING;
  return null;
};
