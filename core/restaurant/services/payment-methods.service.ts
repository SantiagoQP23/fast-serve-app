import { restaurantApi } from "@/core/api/restaurantApi";
import { PaymentMethod } from "../models/payment-method.model";
import type { CreatePaymentMethodDto } from "@/presentation/restaurant/interfaces/dto/create-payment-method.dto";
import type { UpdatePaymentMethodDto } from "@/presentation/restaurant/interfaces/dto/update-payment-method.dto";

export class PaymentMethodsService {
  static async getPaymentMethods(): Promise<PaymentMethod[]> {
    const resp = await restaurantApi.get<PaymentMethod[]>("/payment-methods");
    return resp.data;
  }

  static async create(
    data: CreatePaymentMethodDto,
  ): Promise<PaymentMethod> {
    const resp = await restaurantApi.post<PaymentMethod>(
      "/payment-methods",
      data,
    );
    return resp.data;
  }

  static async update(
    id: number,
    data: UpdatePaymentMethodDto,
  ): Promise<PaymentMethod> {
    const resp = await restaurantApi.patch<PaymentMethod>(
      `/payment-methods/${id}`,
      data,
    );
    return resp.data;
  }

  static async remove(id: number): Promise<void> {
    await restaurantApi.delete(`/payment-methods/${id}`);
  }
}
