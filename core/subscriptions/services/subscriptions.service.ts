import { restaurantApi } from "@/core/api/restaurantApi";
import type { Plan } from "@/core/common/models/restaurant.model";
import type {
  VerifyPurchaseDto,
  VerifyPurchaseResponse,
} from "@/core/subscriptions/dto/verify-purchase.dto";

export class SubscriptionsService {
  static async getPlans() {
    const resp = await restaurantApi.get<Plan[]>("subscriptions/plans/all");
    return resp.data;
  }

  static async verifyPurchase(dto: VerifyPurchaseDto) {
    const resp = await restaurantApi.post<VerifyPurchaseResponse>(
      "subscriptions/purchases/verify",
      dto,
    );
    return resp.data;
  }
}
