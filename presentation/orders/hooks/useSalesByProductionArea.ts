import { useQuery } from "@tanstack/react-query";
import { OrdersService } from "@/core/orders/services/orders.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { DateRange } from "@/core/orders/enums/date-range-filter.enum";

export const useSalesByProductionArea = (
  dateRange: DateRange,
  userId?: string,
) => {
  const { currentRestaurant } = useAuthStore((state) => state);

  const query = useQuery({
    queryKey: [
      "salesByProductionArea",
      currentRestaurant?.id,
      dateRange.startDate,
      dateRange.endDate,
      userId,
    ],
    queryFn: () =>
      OrdersService.getSalesByProductionArea({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        userId,
      }),
    enabled: !!currentRestaurant?.id,
    staleTime: 30000,
  });

  return {
    areas: query.data?.areas ?? [],
    totalAmountSold: query.data?.totalAmountSold ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};
