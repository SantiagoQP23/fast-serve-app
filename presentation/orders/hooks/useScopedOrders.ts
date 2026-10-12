import { useMemo } from "react";
import { useOrdersStore } from "../store/useOrdersStore";
import { useOrdersViewStore } from "../store/useOrdersViewStore";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

// Active orders narrowed by the user's persisted "my orders / all orders"
// choice. Use this anywhere in the orders module that lists orders.
export const useScopedOrders = () => {
  const orders = useOrdersStore((state) => state.orders);
  const ordersScope = useOrdersViewStore((state) => state.ordersScope);
  const userId = useAuthStore((state) => state.user?.id);

  return useMemo(
    () =>
      ordersScope === "all-orders"
        ? orders
        : orders.filter((order) => order.user?.id === userId),
    [orders, ordersScope, userId],
  );
};
