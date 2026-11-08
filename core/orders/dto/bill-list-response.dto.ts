import { PaymentMethod } from "../enums/payment-method";
import { Bill, BillStatus } from "../models/bill.model";

export interface BillOwnerPersonDto {
  firstName: string;
  lastName: string;
}

export interface BillOwnerDto {
  id: string;
  username: string;
  fullName: string;
  person: BillOwnerPersonDto;
}

export interface BillOrderDto {
  id: string;
  num: number;
  total: number;
  tableName: string;
}

export interface BillListItemDto {
  id: number;
  num: number;
  /** Who the bill is for, when it was named (split bills). */
  label?: string | null;
  total: number;
  comments: string;
  subtotal: number;
  discount: number;
  status: BillStatus;
  paymentMethod: PaymentMethod;
  createdAt: string; // ISO date string
  owner?: BillOwnerDto;
  order: BillOrderDto;
}

export interface BillListResponseDto {
  bills: Bill[];
  count: number;
  totalSales: number;
  totalPaid: number;
  totalUnpaid: number;
  countPaid: number;
  countUnpaid: number;
}
