import { restaurantApi } from "@/core/api/restaurantApi";
import type { Plan } from "@/core/common/models/restaurant.model";

export class SubscriptionsService {
  static async getPlans() {
    const resp = await restaurantApi.get<Plan[]>("subscriptions/plans/all");
    return resp.data;
  }
}
