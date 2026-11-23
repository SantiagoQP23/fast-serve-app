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

export type TransactionMetadata = TransferMetadata | CashMetadata;

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
  /** Applied to the bill. */
  amount: number;
  // Card commission, computed by the server (plans/comision-tarjeta.md).
  // Non-card: gross = net = amount, commission 0. Optional for old caches.
  commissionPercentage?: number;
  commissionChargedToCustomer?: boolean;
  /** What was charged on the card. */
  grossAmount?: number;
  /** What the card processor keeps. */
  commissionAmount?: number;
  /** What reaches the account. */
  netAmount?: number;
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

/** Cash added to an open register: not a sale, never counted as income. */
export const isCashDeposit = (transaction?: Pick<Transaction, "category">) =>
  transaction?.category?.code === TransactionCategoryCode.CASH_DEPOSIT;
