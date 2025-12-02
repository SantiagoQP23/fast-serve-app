import { PaymentMethod } from "../enums/payment-method";
import { CreateBillDto } from "./create-bill.dto";

export interface UpdateBillDto extends Partial<CreateBillDto> {
  id: number;
  paymentMethod: string;
  isPaid?: boolean;
  // cashRegisterId?: number;
  // accountId?: number;
}
