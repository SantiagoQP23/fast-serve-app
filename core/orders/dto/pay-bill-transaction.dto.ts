export interface PayBillTransactionDto {
  idempotencyKey: string;
  name: string;
  description?: string;
  amount: number;
  paymentMethodId: number;
  accountId: number;
  billId?: number;
  /** Transfers only. `false` approves the payment right away (owner/admin). */
  requestApproval?: boolean;
}
