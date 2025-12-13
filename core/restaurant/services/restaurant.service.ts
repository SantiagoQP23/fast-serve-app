import { restaurantApi } from "@/core/api/restaurantApi";
import { LoginResponseDto } from "@/core/auth/dto/login.response.dto";

export class RestaurantService {
  static async switchRestaurant(restaurantId: string) {
    const resp = await restaurantApi.post<LoginResponseDto>(
      `/auth/switch-restaurant/${restaurantId}`,
    );
    return resp.data;
  }
}
