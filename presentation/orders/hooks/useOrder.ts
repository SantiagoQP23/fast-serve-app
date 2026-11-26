import { useQuery } from "@tanstack/react-query";
import { OrdersService } from "@/core/orders/services/orders.service";
import { useOrdersStore } from "../store/useOrdersStore";
import { useEffect } from "react";
import { fromServerOrder } from "@/presentation/offline/rebase";

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

  // Sync the fetched order with the active order in the store, with this
  // phone's queued actions on top (the fetch may not have them yet).
  useEffect(() => {
    if (orderQuery.data) {
      const order = fromServerOrder(orderQuery.data);
      setActiveOrder(order);
      if (order.isClosed) {
        deleteOrder(order.id);
      } else {
        updateOrder(order);
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
