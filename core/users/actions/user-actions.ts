import { restaurantApi } from "@/core/api/restaurantApi";
import { User } from "@/core/auth/models/user.model";
import { InviteUserDto } from "@/core/users/dto/invite-user.dto";
import { UpdateUserRoleDto } from "@/core/users/dto/update-user-role.dto";

export const getUsers = async (): Promise<User[]> => {
  const { data } = await restaurantApi.get<{ users: User[]; count: number }>(
    "/users",
  );
  return data.users;
};

export const getUsersSuggestions = async (search: string): Promise<User[]> => {
  const { data } = await restaurantApi.get<{ users: User[] }>(
    "/users/suggestions",
    { params: { search } },
  );
  return data.users;
};

export const inviteUser = async (dto: InviteUserDto): Promise<void> => {
  await restaurantApi.post("/restaurant/invite-user", dto);
};

export const updateUserRole = async (
  dto: UpdateUserRoleDto,
): Promise<void> => {
  await restaurantApi.patch("/users/user-role", dto);
};

export const removeUserFromRestaurant = async (
  userId: string,
): Promise<void> => {
  await restaurantApi.delete(`/users/${userId}/restaurant`);
};
