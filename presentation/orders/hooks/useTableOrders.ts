import { useMemo } from "react";
import { useOrdersStore } from "../store/useOrdersStore";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";

export const useTableOrders = (tableId: string) => {
  const orders = useOrdersStore((state) => state.orders);

  const tableOrders = useMemo(
    () => orders.filter((order) => order.table?.id === tableId),
    [orders, tableId],
  );

  const pendingOrders = useMemo(
    () => tableOrders.filter((order) => order.status === OrderStatus.PENDING),
    [tableOrders],
  );

  const inProgressOrders = useMemo(
    () =>
      tableOrders.filter((order) => order.status === OrderStatus.IN_PROGRESS),
    [tableOrders],
  );

  const deliveredOrders = useMemo(
    () =>
      tableOrders.filter((order) => order.status === OrderStatus.DELIVERED),
    [tableOrders],
  );

  const totalAmount = useMemo(
    () => tableOrders.reduce((sum, order) => sum + order.total, 0),
    [tableOrders],
  );

  const activeOrdersCount = useMemo(
    () =>
      tableOrders.filter(
        (order) =>
          order.status === OrderStatus.PENDING ||
          order.status === OrderStatus.IN_PROGRESS,
      ).length,
    [tableOrders],
  );

  return {
    tableOrders,
    pendingOrders,
    inProgressOrders,
    deliveredOrders,
    totalAmount,
    activeOrdersCount,
    hasOrders: tableOrders.length > 0,
  };
};
