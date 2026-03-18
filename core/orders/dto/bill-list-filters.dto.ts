import { PaymentMethod } from "../enums/payment-method";

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
  limit?: number;
  offset?: number;
}
