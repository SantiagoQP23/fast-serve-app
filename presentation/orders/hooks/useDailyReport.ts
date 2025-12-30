import { useQuery } from "@tanstack/react-query";
import { OrdersService } from "@/core/orders/services/orders.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { FilterDailyReportDto, ReportMode } from "@/core/orders/dto/daily-report-filters.dto";

export const useDailyReport = (filters?: FilterDailyReportDto) => {
  const { currentRestaurant } = useAuthStore((state) => state);

  const dailyReportQuery = useQuery({
    queryKey: ["dailyReport", currentRestaurant?.id, filters],
    queryFn: async () => {
      const result = await OrdersService.getDailyReport({
        mode: ReportMode.SUMMARY,
        includeOrderDetails: false,
        ...filters,
      });
      return result;
    },
    enabled: !!currentRestaurant?.id,
    staleTime: 30000, // 30 seconds
  });

  return {
    dailyReport: dailyReportQuery.data,
    isLoading: dailyReportQuery.isLoading,
    isError: dailyReportQuery.isError,
    refetch: dailyReportQuery.refetch,
  };
};
