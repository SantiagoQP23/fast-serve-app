import { useMemo } from "react";
import { useOrdersStore } from "../store/useOrdersStore";
import { Table } from "@/core/tables/models/table.model";

export const useTableByStatus = (tables: Table[]) => {
  const orders = useOrdersStore((state) => state.orders);

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
