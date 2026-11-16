import { User } from "@/core/auth/models/user.model";
import { Bill } from "@/core/orders/models/bill.model";
import { Account } from "@/core/restaurant/models/account.model";
import { PaymentMethod } from "@/core/restaurant/models/payment-method.model";
import {
  TransactionCategory,
  TransactionCategoryCode,
} from "./transaction-category.model";
import { TransactionStatus } from "./transaction-status.enum";
import { PaymentProof } from "./payment-proof.model";

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
  createdBy?: User;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  status: TransactionStatus;
  bill?: Bill;
  isEditable: boolean;
  metadata: TransactionMetadata | null;
  proofs?: PaymentProof[];
  /** Register session it went into or out of (detail only). */
  cashSession?: { id: number; status: "OPEN" | "CLOSED" } | null;
  approvedBy?: User | null;
}

export const isCashWithdrawal = (transaction?: Pick<Transaction, "category">) =>
  transaction?.category?.code === TransactionCategoryCode.CASH_WITHDRAWAL;
