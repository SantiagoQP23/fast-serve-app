import { useQuery } from "@tanstack/react-query";
import { OrdersService } from "@/core/orders/services/orders.service";
import { useOrdersStore } from "../store/useOrdersStore";
import { useEffect } from "react";

export const useOrder = (orderId: string | null) => {
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const updateOrder = useOrdersStore((state) => state.updateOrder);
  const deleteOrder = useOrdersStore((state) => state.deleteOrder);

  const orderQuery = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) throw new Error("Order ID is required");
      const result = await OrdersService.getOrderById(orderId);
      return result;
    },
    enabled: !!orderId,
    staleTime: 0, // Always consider data stale to ensure fresh data on refetch
  });

  // Sync the fetched order with the active order in the store
  useEffect(() => {
    if (orderQuery.data) {
      setActiveOrder(orderQuery.data);
      if (orderQuery.data.isClosed) {
        deleteOrder(orderQuery.data.id);
      } else {
        updateOrder(orderQuery.data);
      }
    }
  }, [orderQuery.data, setActiveOrder]);

  return {
    order: orderQuery.data,
    isLoading: orderQuery.isLoading,
    isError: orderQuery.isError,
    refetch: orderQuery.refetch,
    isRefetching: orderQuery.isRefetching,
  };
};
