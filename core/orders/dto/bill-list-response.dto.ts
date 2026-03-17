import { PaymentMethod } from "../enums/payment-method";
import { BillStatus } from "../models/bill.model";

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
  total: number;
  comments: string;
  subtotal: number;
  discount: number;
  status: BillStatus;
  paymentMethod: PaymentMethod;
  createdAt: string; // ISO date string
  owner: BillOwnerDto;
  order: BillOrderDto;
}

export interface BillListResponseDto {
  bills: BillListItemDto[];
  count: number;
}
