import { useMemo } from "react";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useTablesStore } from "./useTablesStore";

/**
 * Estado de una mesa: ocupada si tiene pedidos abiertos (de cualquier mesero,
 * sin importar el filtro "mis pedidos") o si alguien la marcó ocupada a mano.
 */
export const useTableStatus = (tableId: string) => {
  const orders = useOrdersStore((state) => state.orders);
  const table = useTablesStore((state) =>
    state.tables.find((t) => t.id === tableId),
  );

  const hasOpenOrders = useMemo(
    () =>
      orders.some((order) => order.table?.id === tableId && !order.isClosed),
    [orders, tableId],
  );

  return {
    table,
    hasOpenOrders,
    isOccupied: hasOpenOrders || table?.isAvailable === false,
  };
};
