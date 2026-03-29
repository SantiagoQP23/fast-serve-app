import { Transaction } from "@/core/transactions/models/transaction.model";

export interface PayBillTransactionRespDto {
  transaction: Transaction;
  billId?: number;
  orderId?: string;
}
