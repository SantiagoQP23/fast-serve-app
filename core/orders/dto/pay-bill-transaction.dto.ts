export interface PayBillTransactionDto {
  idempotencyKey: string;
  name: string;
  description?: string;
  amount: number;
  paymentMethodId: number;
  accountId: number;
  billId?: number;
}
