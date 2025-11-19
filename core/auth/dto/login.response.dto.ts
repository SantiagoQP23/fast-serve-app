import { User } from "../models/user.model";

export interface LoginResponseDto {
  token: string;
  user: User;
  // currentRestaurant: Restaurant | null;
}
