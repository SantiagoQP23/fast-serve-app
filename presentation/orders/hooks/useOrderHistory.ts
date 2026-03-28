import { useQuery } from "@tanstack/react-query";
import { OrdersService } from "@/core/orders/services/orders.service";
import { OrderHistoryFiltersDto } from "@/core/orders/dto/order-history-filters.dto";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useState, useCallback, useEffect } from "react";
import { Order } from "@/core/orders/models/order.model";

export const useOrderHistory = (filters?: OrderHistoryFiltersDto) => {
  const { currentRestaurant } = useAuthStore();
  const [page, setPage] = useState(0);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const limit = 10;

  const filtersWithDefaults: OrderHistoryFiltersDto = {
    startDate: new Date().toISOString().split("T")[0],
    ...filters,
    limit,
    offset: page * limit,
  };

  const query = useQuery({
    queryKey: ["orderHistory", currentRestaurant?.id, page, filtersWithDefaults],
    queryFn: () => OrdersService.getOrderHistory(filtersWithDefaults),
    staleTime: 30000,
    enabled: !!currentRestaurant?.id,
  });

  useEffect(() => {
    if (query.data?.orders) {
      if (page === 0) {
        setAllOrders(query.data.orders);
      } else {
        setAllOrders((prev) => [...prev, ...query.data.orders]);
      }
    }
  }, [query.data, page]);

  const loadMore = useCallback(() => {
    if (
      query.data?.count &&
      allOrders.length < query.data.count
    ) {
      setPage((prev) => prev + 1);
    }
  }, [query.data, allOrders.length]);

  const reset = useCallback(() => {
    setPage(0);
  }, []);

  const hasMore = query.data?.count
    ? (page + 1) * limit < query.data.count
    : false;

  const isLoadingMore = query.isLoading && page > 0;

  return {
    orders: allOrders,
    count: query.data?.count || 0,
    isLoading: query.isLoading,
    isLoadingMore,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    loadMore,
    reset,
    hasMore,
    currentPage: page,
  };
};
