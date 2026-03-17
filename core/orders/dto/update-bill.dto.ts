import { PaymentMethod } from "../enums/payment-method";
import { CreateBillDto } from "./create-bill.dto";

export interface UpdateBillDto extends Partial<CreateBillDto> {
  id: number;
  paymentMethod: string;
  // cashRegisterId?: number;
  accountId?: number;
  transferNote?: string;
}
