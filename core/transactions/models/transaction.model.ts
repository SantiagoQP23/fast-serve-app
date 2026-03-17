import { User } from "@/core/auth/models/user.model";
import { Bill } from "@/core/orders/models/bill.model";
import { Account } from "@/core/restaurant/models/account.model";
import { PaymentMethod } from "@/core/restaurant/models/payment-method.model";
import { TransactionCategory } from "./transaction-category.model";

export type TransactionMetadata =
  | CardMetadata
  | TransferMetadata
  | CashMetadata;

export interface CardMetadata {
  type: "CARD";
  totalWithCommission: number;
}

export interface TransferMetadata {
  type: "TRANSFER";
  bankReference: string;
  senderName?: string;
}

export interface CashMetadata {
  type: "CASH";
  cashReceived?: number;
  changeGiven?: number;
}

export interface Transaction {
  id: number;
  num: number;
  amount: number;
  description: string;
  name: string;
  paymentMethod: PaymentMethod;
  account: Account;
  category: TransactionCategory;
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  bill?: Bill;
  isEditable: boolean;
  metadata: TransactionMetadata | null;
}
