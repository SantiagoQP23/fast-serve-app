import { Transaction } from "../models/transaction.model";
import { TransactionStatus } from "../models/transaction-status.enum";

export interface TransactionListResponseDto {
  transactions: Transaction[];
  count: number;
  totalIncome: number;
  totalExpense: number;
  // Counts per status for the same filters, ignoring `status`
  statusCounts?: Partial<Record<TransactionStatus, number>>;
}
