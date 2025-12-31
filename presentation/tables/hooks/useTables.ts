import { Table } from "@/core/tables/models/table.model";
import { TablesService } from "@/core/tables/services/tables.service";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

export const useTables = () => {
  const { currentRestaurant } = useAuthStore();
  const tablesQuery = useQuery({
    queryKey: ["tables", currentRestaurant?.id],
    queryFn: () => TablesService.getTables(),
    enabled: !!currentRestaurant?.id,
  });
  return {
    tables: tablesQuery.data || [],
    refetch: tablesQuery.refetch,
    isRefetching: tablesQuery.isRefetching,
    isLoading: tablesQuery.isLoading,
  };
};
