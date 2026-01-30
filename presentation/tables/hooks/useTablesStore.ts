import { Table } from "@/core/tables/models/table.model";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AsyncStorageAdapter } from "@/helpers/adapters/async-storage.adapter";

export interface TablesState {
  // Table data
  tables: Table[];
  restaurantId: string | null;
  lastUpdated: number | null;
}

interface TablesActions {
  setTables: (tables: Table[], restaurantId: string) => void;
  clearTables: () => void;
  reset: () => void;
}

const initialState: TablesState = {
  tables: [],
  restaurantId: null,
  lastUpdated: null,
};

export const useTablesStore = create<TablesState & TablesActions>()(
  persist(
    (set) => ({
      ...initialState,
      
      setTables: (tables: Table[], restaurantId: string) =>
        set({
          tables,
          restaurantId,
          lastUpdated: Date.now(),
        }),
      
      clearTables: () =>
        set({
          tables: [],
          restaurantId: null,
          lastUpdated: null,
        }),
      
      reset: () => set(initialState),
    }),
    {
      name: "tablesStore",
      storage: createJSONStorage(() => AsyncStorageAdapter),
    },
  ),
);
