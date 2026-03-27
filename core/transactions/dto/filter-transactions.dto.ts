export interface FilterTransactionsDto {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  paymentMethodId?: number;
  accountId?: number;
}
