import { Table } from "@/core/tables/models/table.model";
import { OrderDetail } from "./order-detail.model";
import { User } from "@/core/auth/models/user.model";
import { OrderStatus } from "../enums/order-status.enum";
import { OrderType } from "../enums/order-type.enum";
import { OrderPaymentStatus } from "../enums/order-payment-status.enum";
import { Bill } from "./bill.model";
import { getBillCommittedAmount } from "../utils/bill-payment.util";
import { Ticket } from "@/core/tickets/models/ticket.model";

export interface Order {
  notes: string;
  deliveryTime: Date;
  /** The waiter picked the delivery time instead of the standard prep time. */
  isScheduled?: boolean;
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
  /** A bill has a payment or a transfer waiting for proof/approval. */
  HAS_PAYMENTS = "HAS_PAYMENTS",
}

/**
 * Only a pending order with nothing handed out yet and no payments on its
 * bills can be deleted; its unpaid bills are deleted with it. The backend
 * enforces the same rule. Returns why it can't, or null when it can.
 */
export const getOrderDeleteBlockReason = (
  order: Order,
  bills: Bill[] = order.bills ?? [],
): OrderDeleteBlockReason | null => {
  if ((order.details ?? []).some((detail) => detail.qtyDelivered > 0))
    return OrderDeleteBlockReason.DELIVERED;
  if (order.status !== OrderStatus.PENDING)
    return OrderDeleteBlockReason.NOT_PENDING;
  if (bills.some((bill) => getBillCommittedAmount(bill) > 0))
    return OrderDeleteBlockReason.HAS_PAYMENTS;
  return null;
};
