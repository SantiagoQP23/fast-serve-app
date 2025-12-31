import { restaurantApi } from "@/core/api/restaurantApi";
import { LoginResponseDto } from "@/core/auth/dto/login.response.dto";

export class RestaurantService {
  static async switchRestaurant(restaurantId: string) {
    const resp = await restaurantApi.post<LoginResponseDto>(
      `/auth/switch-restaurant/${restaurantId}`,
    );

    // Process the response to set the correct role based on current restaurant
    const { token, user, currentRestaurant } = resp.data;
    const currentRole = user.restaurantRoles.find(
      (resRole) => resRole.restaurant.id === currentRestaurant?.id,
    )!.role;

    return {
      token,
      user: { ...user, role: currentRole },
      currentRestaurant,
    };
  }
}
