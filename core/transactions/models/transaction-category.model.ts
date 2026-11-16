export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

/** Built-in categories; the app translates their name by code. */
export enum TransactionCategoryCode {
  SALES = "SALES",
  CASH_WITHDRAWAL = "CASH_WITHDRAWAL",
}

export interface TransactionCategory {
  id: number;
  name: string;
  code?: TransactionCategoryCode | null;
  description: string;
  transactionType: TransactionType;
  createdAt: Date;
  updatedAt: Date;
  color: string;
  isActive: boolean;
}
