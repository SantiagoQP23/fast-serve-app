import { Bill } from "@/core/orders/models/bill.model";
import { Order } from "@/core/orders/models/order.model";
import { Transaction } from "@/core/transactions/models/transaction.model";

export interface RemoveTransactionRespDto {
  transaction: Transaction;
  bill: Bill;
  order: Order | null;
}
