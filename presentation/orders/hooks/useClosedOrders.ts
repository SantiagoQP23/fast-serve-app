import { useQuery } from "@tanstack/react-query";
import { OrdersService } from "@/core/orders/services/orders.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useState, useCallback } from "react";
import { Order } from "@/core/orders/models/order.model";

export const useClosedOrders = () => {
  const { currentRestaurant } = useAuthStore();
  const [page, setPage] = useState(0);
  const limit = 20;

  const closedOrdersQuery = useQuery({
    queryKey: ["closedOrders", currentRestaurant?.id, page],
    queryFn: async () => {
      const result = await OrdersService.getUserClosedOrders(limit, page * limit);
      return result;
    },
    enabled: false, // Manual trigger, not auto-fetch
    staleTime: 60000, // 1 minute cache
  });

  const loadMore = useCallback(() => {
    if (closedOrdersQuery.data?.count && 
        closedOrdersQuery.data.orders.length < closedOrdersQuery.data.count) {
      setPage((prev) => prev + 1);
    }
  }, [closedOrdersQuery.data]);

  const reset = useCallback(() => {
    setPage(0);
  }, []);

  const hasMore = closedOrdersQuery.data?.count 
    ? (page + 1) * limit < closedOrdersQuery.data.count
    : false;

  return {
    closedOrders: closedOrdersQuery.data?.orders ?? [],
    totalCount: closedOrdersQuery.data?.count ?? 0,
    isLoading: closedOrdersQuery.isLoading,
    isError: closedOrdersQuery.isError,
    refetch: closedOrdersQuery.refetch,
    loadMore,
    reset,
    hasMore,
    currentPage: page,
  };
};
