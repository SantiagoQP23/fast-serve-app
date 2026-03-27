export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export interface TransactionCategory {
  id: number;
  name: string;
  description: string;
  transactionType: TransactionType;
  createdAt: Date;
  updatedAt: Date;
  color: string;
  isActive: boolean;
}
