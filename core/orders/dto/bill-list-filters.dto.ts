import { PaymentMethod } from "../enums/payment-method";
import { BillSource } from "../models/bill.model";

export enum BillStatusFilter {
  PAID = "paid",
  UNPAID = "unpaid",
  ALL = "all",
}

export interface BillListFiltersDto {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  ownerId?: string; // Filter by waiter
  paymentMethod?: PaymentMethod;
  status?: BillStatusFilter;
  source?: BillSource;
  limit?: number;
  offset?: number;
}
