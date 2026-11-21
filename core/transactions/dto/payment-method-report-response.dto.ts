export interface PaymentMethodReportItem {
  paymentMethodId: number;
  paymentMethodName: string;
  paymentMethodType: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  /** Charged on cards; missing on older backends. */
  totalGross?: number;
  /** Card commission kept by the processor (plans/comision-tarjeta.md). */
  totalCommission?: number;
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
    totalGross?: number;
    totalCommission?: number;
    totalTransactions: number;
  };
}
