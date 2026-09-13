import type { CreatePaymentMethodDto } from "./create-payment-method.dto";

export interface UpdatePaymentMethodDto
  extends Partial<CreatePaymentMethodDto> {
  isActive?: boolean;
}
