import { useQuery } from "@tanstack/react-query";
import { BillsService } from "@/core/orders/services/bills.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { FilterPaymentMethodReportDto } from "@/core/orders/dto/payment-method-report-filters.dto";

export const usePaymentMethodReport = (filters?: FilterPaymentMethodReportDto) => {
  const { currentRestaurant } = useAuthStore((state) => state);

  const paymentMethodReportQuery = useQuery({
    queryKey: ["paymentMethodReport", currentRestaurant?.id, filters],
    queryFn: async () => {
      const result = await BillsService.getPaymentMethodReport(filters);
      return result;
    },
    enabled: !!currentRestaurant?.id,
    staleTime: 30000, // 30 seconds
  });

  return {
    paymentMethodReport: paymentMethodReportQuery.data,
    isLoading: paymentMethodReportQuery.isLoading,
    isError: paymentMethodReportQuery.isError,
    refetch: paymentMethodReportQuery.refetch,
  };
};
