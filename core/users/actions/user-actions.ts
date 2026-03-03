import { restaurantApi } from "@/core/api/restaurantApi";
import { User } from "@/core/auth/models/user.model";

export const getUsers = async (): Promise<User[]> => {
  const { data } = await restaurantApi.get<{ users: User[]; count: number }>(
    "/users",
  );
  return data.users;
};
