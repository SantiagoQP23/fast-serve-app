import { Restaurant } from "@/core/common/models/restaurant.model";
import { User } from "../models/user.model";

export interface LoginResponseDto {
  token: string;
  user: User;
  currentRestaurant: Restaurant | null;
}
