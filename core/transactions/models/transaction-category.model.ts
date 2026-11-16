export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

/** Built-in categories; the app translates their name by code. */
export enum TransactionCategoryCode {
  SALES = "SALES",
  CASH_WITHDRAWAL = "CASH_WITHDRAWAL",
  /** Cash added to an open register (plans/ingreso-efectivo-caja.md). */
  CASH_DEPOSIT = "CASH_DEPOSIT",
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
