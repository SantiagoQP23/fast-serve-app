import { useMemo } from "react";
import { useOrdersStore } from "../store/useOrdersStore";
import { Table } from "@/core/tables/models/table.model";

export const useTableByStatus = (tables: Table[]) => {
  const orders = useOrdersStore((state) => state.orders);

  // Ocupada: tiene pedidos abiertos (de cualquier mesero) o alguien la marcó
  // ocupada a mano. Igual que useTableStatus.
  const isOccupied = useMemo(() => {
    const withOrders = new Set(
      orders.filter((order) => !order.isClosed).map((order) => order.table?.id),
    );
    return (table: Table) =>
      withOrders.has(table.id) || table.isAvailable === false;
  }, [orders]);

  const occupiedTables = useMemo(
    () => tables.filter(isOccupied),
    [tables, isOccupied],
  );

  const availableTables = useMemo(
    () => tables.filter((table) => !isOccupied(table)),
    [tables, isOccupied],
  );

  return {
    tables,
    occupiedTables,
    availableTables,
  };
};
