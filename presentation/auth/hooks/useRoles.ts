import { useQuery } from "@tanstack/react-query";
import { getRoles } from "@/core/auth/actions/role-actions";

export const useRoles = () => {
  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
  });

  return {
    roles: rolesQuery.data ?? [],
    isLoading: rolesQuery.isLoading,
  };
};
