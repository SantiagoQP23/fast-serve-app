import { Table } from "@/core/tables/models/table.model";
import { create } from "zustand";

interface TablesState {
  tables: Table[];
  loadTables: (tables: Table[]) => void;
  reset: () => void;
}

const initialState = {
  tables: [],
};

export const useTablesStore = create<TablesState>((set) => ({
  ...initialState,
  loadTables: (tables: Table[]) => {
    set({ tables });
  },
  reset: () => set(initialState),
}));
