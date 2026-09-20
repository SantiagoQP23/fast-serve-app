import { restaurantApi } from "@/core/api/restaurantApi";
import { IRole } from "@/core/auth/models/user.model";

export const getRoles = async (): Promise<IRole[]> => {
  const { data } = await restaurantApi.get<IRole[]>("/roles");
  return data;
};
