import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { OrdersService } from "@/core/orders/services/orders.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useOrdersStore } from "../store/useOrdersStore";

export const useActiveOrders = () => {
  console.log('[useActiveOrders] Hook called');
  const setOrders = useOrdersStore((state) => state.setOrders);
  const { currentRestaurant } = useAuthStore((state) => state);

  const activeOrdersQuery = useQuery({
    queryKey: ["activeOrders", currentRestaurant?.id],
    queryFn: async () => {
      console.log(`[useActiveOrders] Fetching orders for restaurant: ${currentRestaurant?.id}`);
      const result = await OrdersService.getActiveOrders();
      console.log(`[useActiveOrders] Fetched ${result.length} orders`);
      return result;
    },
    enabled: !!currentRestaurant?.id,
    staleTime: 0, // Always consider data stale to ensure refetch on restaurant change
  });

  useEffect(() => {
    // Always sync the query data with the store, even if it's empty
    if (activeOrdersQuery.data !== undefined) {
      console.log(
        `[useActiveOrders] Setting active orders for restaurant ${currentRestaurant?.id}:`,
        activeOrdersQuery.data.length,
      );
      setOrders(activeOrdersQuery.data);
    }
  }, [activeOrdersQuery.data, setOrders, currentRestaurant?.id]);

  return {
    activeOrdersQuery,
    refetchOrders: activeOrdersQuery.refetch,
    isRefetching: activeOrdersQuery.isRefetching,
  };
};
