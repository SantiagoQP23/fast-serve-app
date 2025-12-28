import { useQuery } from "@tanstack/react-query";
import { OrdersService } from "@/core/orders/services/orders.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

export const useDashboardStats = () => {
  const { currentRestaurant } = useAuthStore((state) => state);

  const dashboardStatsQuery = useQuery({
    queryKey: ["dashboardStats", currentRestaurant?.id],
    queryFn: async () => {
      const result = await OrdersService.getDashboardStats();
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
