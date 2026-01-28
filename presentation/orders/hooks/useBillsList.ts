import { useQuery } from "@tanstack/react-query";
import { BillsService } from "@/core/orders/services/bills.service";
import { BillListFiltersDto } from "@/core/orders/dto/bill-list-filters.dto";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

export const useBillsList = (filters?: BillListFiltersDto) => {
  const { currentRestaurant } = useAuthStore();

  // Add default startDate (today) if not provided
  const filtersWithDefaults: BillListFiltersDto = {
    startDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    ...filters,
  };

  const billsListQuery = useQuery({
    queryKey: ["billsList", currentRestaurant?.id, filtersWithDefaults],
    queryFn: () => BillsService.getBillList(filtersWithDefaults),
    staleTime: 30000, // 30 seconds
    enabled: !!currentRestaurant?.id,
  });

  return {
    bills: billsListQuery.data?.bills || [],
    count: billsListQuery.data?.count || 0,
    isLoading: billsListQuery.isLoading,
    isError: billsListQuery.isError,
    error: billsListQuery.error,
    refetch: billsListQuery.refetch,
    isRefetching: billsListQuery.isRefetching,
  };
};
