import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { OrdersService } from "@/core/orders/services/orders.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { DateRange } from "@/core/orders/enums/date-range-filter.enum";
import { BestSellingCategoryDto } from "@/core/orders/dto/best-selling-categories.dto";

export const useBestSellingCategories = (
  dateRange: DateRange,
  pageSize: number = 10,
  userId?: string,
) => {
  const { currentRestaurant } = useAuthStore((state) => state);
  const [page, setPage] = useState(0);
  const [allCategories, setAllCategories] = useState<
    BestSellingCategoryDto[]
  >([]);

  const filters = {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    limit: pageSize,
    offset: page * pageSize,
    userId,
  };

  const query = useQuery({
    queryKey: [
      "bestSellingCategories",
      currentRestaurant?.id,
      dateRange.startDate,
      dateRange.endDate,
      pageSize,
      userId,
      page,
    ],
    queryFn: () => OrdersService.getBestSellingCategories(filters),
    enabled: !!currentRestaurant?.id,
    staleTime: 30000,
  });

  useEffect(() => {
    if (query.data?.categories) {
      setAllCategories((prev) =>
        page === 0
          ? query.data.categories
          : [...prev, ...query.data.categories],
      );
    }
  }, [query.data, page]);

  const loadMore = useCallback(() => {
    if (query.data?.count && allCategories.length < query.data.count) {
      setPage((prev) => prev + 1);
    }
  }, [query.data, allCategories.length]);

  const reset = useCallback(() => {
    setPage(0);
  }, []);

  const hasMore = query.data?.count
    ? (page + 1) * pageSize < query.data.count
    : false;

  const isLoadingMore = query.isLoading && page > 0;

  return {
    categories: allCategories,
    count: query.data?.count || 0,
    isLoading: query.isLoading,
    isLoadingMore,
    isError: query.isError,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    loadMore,
    reset,
    hasMore,
  };
};
