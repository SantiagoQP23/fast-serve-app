import { Transaction } from "../models/transaction.model";

export interface TransactionListResponseDto {
  transactions: Transaction[];
  count: number;
}
