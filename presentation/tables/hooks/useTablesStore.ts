import { Table } from "@/core/tables/models/table.model";
import { create } from "zustand";

interface TablesState {
  tables: Table[];
  loadTables: (tables: Table[]) => void;
}

export const useTablesStore = create<TablesState>((set) => ({
  tables: [],
  loadTables: (tables: Table[]) => {
    set({ tables });
  },
}));
