import { TransactionStatus } from "../models/transaction-status.enum";

export interface FilterTransactionsDto {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  paymentMethodId?: number;
  accountId?: number;
  createdById?: string;
  status?: TransactionStatus;
  /** Leave register cash withdrawals out (the Incomes list). */
  excludeWithdrawals?: boolean;
}
