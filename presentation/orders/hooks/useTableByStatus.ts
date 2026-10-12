import { useMemo } from "react";
import { useScopedOrders } from "./useScopedOrders";
import { Table } from "@/core/tables/models/table.model";

export const useTableByStatus = (tables: Table[]) => {
  const orders = useScopedOrders();

  const occupiedTables = useMemo(() => {
    return tables.filter((table) =>
      orders.some((order) => order.table?.id === table.id),
    );
  }, [tables, orders]);

  const availableTables = useMemo(() => {
    return tables.filter(
      (table) => !orders.some((order) => order.table?.id === table.id),
    );
  }, [tables, orders]);

  return {
    tables,
    occupiedTables,
    availableTables,
  };
};
