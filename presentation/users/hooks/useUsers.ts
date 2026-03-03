import { getUsers } from "@/core/users/actions/user-actions";
import { useQuery } from "@tanstack/react-query";

export const useUsers = () => {
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  return {
    users: usersQuery.data ?? [],
    isLoading: usersQuery.isLoading,
  };
};
