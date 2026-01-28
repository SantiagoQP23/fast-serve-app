import { PaymentMethod } from "../enums/payment-method";

export interface BillListFiltersDto {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  ownerId?: string; // Filter by waiter
  paymentMethod?: PaymentMethod;
  isPaid?: boolean;
  limit?: number;
  offset?: number;
}
