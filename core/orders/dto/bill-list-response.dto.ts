import { PaymentMethod } from "../enums/payment-method";

export interface BillOwnerDto {
  id: string;
  username: string;
  fullName: string;
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
  isPaid: boolean;
  paymentMethod: PaymentMethod;
  createdAt: string; // ISO date string
  owner: BillOwnerDto;
  order: BillOrderDto;
}

export interface BillListResponseDto {
  bills: BillListItemDto[];
  count: number;
}
