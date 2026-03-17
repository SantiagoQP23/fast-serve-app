import { PaymentMethod } from "../enums/payment-method";
import { BillStatus } from "../models/bill.model";

export interface BillListFiltersDto {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  ownerId?: string; // Filter by waiter
  paymentMethod?: PaymentMethod;
  status?: BillStatus;
  limit?: number;
  offset?: number;
}
