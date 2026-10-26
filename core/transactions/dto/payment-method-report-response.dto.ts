export interface PaymentMethodReportItem {
  paymentMethodId: number;
  paymentMethodName: string;
  paymentMethodType: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactionCount: number;
  percentageOfIncome: number;
  percentageOfExpense: number;
  incomeByAccount: {
    accountId: number;
    accountName: string;
    totalIncome: number;
  }[];
}

/** Every account of the restaurant, even those without income in the range. */
export interface AccountReportItem {
  accountId: number;
  accountName: string;
  totalIncome: number;
  /** Income transactions still waiting for a proof or for approval */
  pendingCount: number;
}

export interface PaymentMethodReportResponse {
  report: PaymentMethodReportItem[];
  /** Missing on backends older than the accounts report */
  accounts?: AccountReportItem[];
  summary: {
    totalIncome: number;
    totalExpense: number;
    net: number;
    totalTransactions: number;
  };
}
