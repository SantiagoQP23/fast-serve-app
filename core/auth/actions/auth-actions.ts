import { restaurantApi } from "@/core/api/restaurantApi";
import { User } from "../models/user.model";
import { Restaurant } from "@/core/common/models/restaurant.model";

export interface AuthResponse {
  token: string;
  user: User;
  currentRestaurant: Restaurant;
}

const returnUserToken = (
  data: AuthResponse,
): {
  user: User;
  token: string;
  currentRestaurant: Restaurant;
} => {
  const { token, user, currentRestaurant } = data;
  const currentRole = data.user.restaurantRoles.find(
    (resRole) => resRole.restaurant.id === data.currentRestaurant?.id,
  )!.role;

  return {
    user: { ...user, role: currentRole },
    token,
    currentRestaurant,
  };
};

export const authLogin = async (username: string, password: string) => {
  try {
    const { data } = await restaurantApi.post<AuthResponse>("/auth/login", {
      username,
      password,
    });

    return returnUserToken(data);
  } catch (error) {
    console.log("Auth error", error);
    // throw new Error('User and/or password not valid');
    return null;
  }
};

export const authCheckStatus = async () => {
  try {
    const { data } = await restaurantApi.get<AuthResponse>("/auth/auth-renew");

    return returnUserToken(data);
  } catch (error) {
    return null;
  }
};

// TODO: Tarea: Hacer el register
