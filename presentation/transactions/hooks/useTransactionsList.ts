import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from "react";
import { TransactionsService } from "@/core/transactions/services/transactions.service";
import { FilterTransactionsDto } from "@/core/transactions/dto/filter-transactions.dto";
import { Transaction } from "@/core/transactions/models/transaction.model";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

const LIMIT = 10;

export const useTransactionsList = (filters?: FilterTransactionsDto) => {
  const { currentRestaurant } = useAuthStore();
  const [page, setPage] = useState(0);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  const filtersWithDefaults: FilterTransactionsDto = {
    startDate: new Date().toISOString().split("T")[0],
    ...filters,
    limit: LIMIT,
    offset: page * LIMIT,
  };

  const query = useQuery({
    queryKey: [
      "transactionsList",
      currentRestaurant?.id,
      page,
      filtersWithDefaults,
    ],
    queryFn: () => TransactionsService.getTransactions(filtersWithDefaults),
    staleTime: 30000,
    enabled: !!currentRestaurant?.id,
  });

  useEffect(() => {
    if (query.data?.transactions) {
      if (page === 0) {
        setAllTransactions(query.data.transactions);
      } else {
        setAllTransactions((prev) => [...prev, ...query.data.transactions]);
      }
    }
  }, [query.data, page]);

  const loadMore = useCallback(() => {
    if (
      query.data?.count !== undefined &&
      allTransactions.length < query.data.count
    ) {
      setPage((prev) => prev + 1);
    }
  }, [query.data, allTransactions.length]);

  const reset = useCallback(() => {
    setPage(0);
  }, []);

  const hasMore = query.data?.count
    ? (page + 1) * LIMIT < query.data.count
    : false;

  return {
    transactions: allTransactions,
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
    isLoadingMore: query.isLoading && page > 0,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    loadMore,
    reset,
    hasMore,
    currentPage: page,
  };
};
