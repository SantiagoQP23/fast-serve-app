import { useQuery } from "@tanstack/react-query";
import { OrdersService } from "@/core/orders/services/orders.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { DateRange } from "@/core/orders/enums/date-range-filter.enum";

export const useDashboardStats = (dateRange?: DateRange, userId?: string) => {
  const { currentRestaurant } = useAuthStore((state) => state);

  const dashboardStatsQuery = useQuery({
    queryKey: [
      "dashboardStats",
      currentRestaurant?.id,
      dateRange?.startDate,
      dateRange?.endDate,
      userId,
    ],
    queryFn: async () => {
      const result = await OrdersService.getDashboardStats({
        ...dateRange,
        userId,
      });
      return result;
    },
    enabled: !!currentRestaurant?.id,
    staleTime: 30000, // 30 seconds
  });

  return {
    dashboardStats: dashboardStatsQuery.data,
    isLoading: dashboardStatsQuery.isLoading,
    isError: dashboardStatsQuery.isError,
    refetch: dashboardStatsQuery.refetch,
  };
};
