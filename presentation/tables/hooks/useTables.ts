import { Table } from "@/core/tables/models/table.model";
import { TablesService } from "@/core/tables/services/tables.service";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useTables = () => {
  const tablesQuery = useQuery({
    queryKey: ["tables"],
    queryFn: () => TablesService.getTables(),
  });
  return {
    tables: tablesQuery.data || [],
  };
};
