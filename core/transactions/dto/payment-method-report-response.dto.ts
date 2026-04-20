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

export interface PaymentMethodReportResponse {
  report: PaymentMethodReportItem[];
  summary: {
    totalIncome: number;
    totalExpense: number;
    net: number;
    totalTransactions: number;
  };
}
