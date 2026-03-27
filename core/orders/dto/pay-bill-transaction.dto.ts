export interface PayBillTransactionDto {
  name: string;
  description?: string;
  amount: number;
  paymentMethodId: number;
  accountId: number;
  billId?: number;
}
