import { useQuery } from "@tanstack/react-query";
import { BillsService } from "@/core/orders/services/bills.service";
import { BillListFiltersDto } from "@/core/orders/dto/bill-list-filters.dto";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useState, useCallback, useEffect } from "react";
import { BillListItemDto } from "@/core/orders/dto/bill-list-response.dto";

export const useBillsList = (filters?: BillListFiltersDto) => {
  const { currentRestaurant } = useAuthStore();
  const [page, setPage] = useState(0);
  const [allBills, setAllBills] = useState<BillListItemDto[]>([]);
  const limit = 10;

  // Add default startDate (today) if not provided, plus pagination params
  const filtersWithDefaults: BillListFiltersDto = {
    startDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
    ...filters,
    limit,
    offset: page * limit,
  };

  const billsListQuery = useQuery({
    queryKey: ["billsList", currentRestaurant?.id, page, filtersWithDefaults],
    queryFn: () => BillsService.getBillList(filtersWithDefaults),
    staleTime: 30000, // 30 seconds
    enabled: !!currentRestaurant?.id,
  });

  // Accumulate bills from all pages
  useEffect(() => {
    if (billsListQuery.data?.bills) {
      if (page === 0) {
        // Reset: replace all bills with first page
        setAllBills(billsListQuery.data.bills);
      } else {
        // Append: add new bills to existing ones
        setAllBills((prev) => [...prev, ...billsListQuery.data.bills]);
      }
    }
  }, [billsListQuery.data, page]);

  const loadMore = useCallback(() => {
    if (
      billsListQuery.data?.count &&
      allBills.length < billsListQuery.data.count
    ) {
      setPage((prev) => prev + 1);
    }
  }, [billsListQuery.data, allBills.length]);

  const reset = useCallback(() => {
    setPage(0);
    setAllBills([]);
  }, []);

  const hasMore = billsListQuery.data?.count
    ? (page + 1) * limit < billsListQuery.data.count
    : false;

  const isLoadingMore = billsListQuery.isLoading && page > 0;

  return {
    bills: allBills,
    count: billsListQuery.data?.count || 0,
    isLoading: billsListQuery.isLoading,
    isLoadingMore,
    isError: billsListQuery.isError,
    error: billsListQuery.error,
    refetch: billsListQuery.refetch,
    isRefetching: billsListQuery.isRefetching,
    loadMore,
    reset,
    hasMore,
    currentPage: page,
  };
};
