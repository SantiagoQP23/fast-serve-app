import { useQuery } from "@tanstack/react-query";
import { TransactionsService } from "@/core/transactions/services/transactions.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { FilterTransactionsDto } from "@/core/transactions/dto/filter-transactions.dto";

export const useTransactionPaymentMethodReport = (
  filters?: FilterTransactionsDto,
) => {
  const { currentRestaurant } = useAuthStore((state) => state);

  const query = useQuery({
    queryKey: ["transactionPaymentMethodReport", currentRestaurant?.id, filters],
    queryFn: async () => {
      const result = await TransactionsService.getPaymentMethodReport(filters);
      return result;
    },
    enabled: !!currentRestaurant?.id,
    staleTime: 30000, // 30 seconds
  });

  return {
    paymentMethodReport: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};
