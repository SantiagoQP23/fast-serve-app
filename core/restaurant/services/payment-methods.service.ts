import { restaurantApi } from "@/core/api/restaurantApi";
import { PaymentMethod } from "../models/payment-method.model";

export class PaymentMethodsService {
  static async getPaymentMethods(): Promise<PaymentMethod[]> {
    const resp = await restaurantApi.get<PaymentMethod[]>("/payment-methods");
    return resp.data;
  }
}
