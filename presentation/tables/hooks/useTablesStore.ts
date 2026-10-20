import { Table } from "@/core/tables/models/table.model";
import { TableArea } from "@/core/tables/models/table-area.model";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createThrottledStorage } from "@/helpers/adapters/throttled-storage";

export interface TablesState {
  // Table data
  tables: Table[];
  /** Zonas del restaurante (incluye las ocultas). */
  areas: TableArea[];
  /** Zona elegida en la pantalla de mesas de este teléfono; null = Todas. */
  selectedAreaId: string | null;
  restaurantId: string | null;
  lastUpdated: number | null;
}

interface TablesActions {
  setTables: (tables: Table[], restaurantId: string) => void;
  addTable: (table: Table) => void;
  updateTable: (table: Table) => void;
  deleteTable: (tableId: string) => void;
  /** Reemplaza las mesas dadas por id (p. ej. tras reordenar). */
  upsertTables: (tables: Table[]) => void;
  setAreas: (areas: TableArea[]) => void;
  setSelectedAreaId: (areaId: string | null) => void;
  upsertArea: (area: TableArea) => void;
  removeArea: (areaId: string) => void;
  clearTables: () => void;
  reset: () => void;
}

const initialState: TablesState = {
  tables: [],
  areas: [],
  selectedAreaId: null,
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

      addTable: (table: Table) =>
        set((state) => ({
          tables: state.tables.some((t) => t.id === table.id)
            ? state.tables
            : [...state.tables, table],
          lastUpdated: Date.now(),
        })),

      updateTable: (table: Table) =>
        set((state) => ({
          tables: state.tables.map((t) => (t.id === table.id ? table : t)),
          lastUpdated: Date.now(),
        })),

      deleteTable: (tableId: string) =>
        set((state) => ({
          tables: state.tables.filter((t) => t.id !== tableId),
          lastUpdated: Date.now(),
        })),

      upsertTables: (tables: Table[]) =>
        set((state) => {
          const byId = new Map(tables.map((t) => [t.id, t]));
          const known = new Set(state.tables.map((t) => t.id));
          return {
            tables: [
              ...state.tables.map((t) => byId.get(t.id) ?? t),
              ...tables.filter((t) => !known.has(t.id)),
            ],
            lastUpdated: Date.now(),
          };
        }),

      setAreas: (areas: TableArea[]) => set({ areas }),

      setSelectedAreaId: (selectedAreaId: string | null) =>
        set({ selectedAreaId }),

      upsertArea: (area: TableArea) =>
        set((state) => ({
          areas: state.areas.some((a) => a.id === area.id)
            ? state.areas.map((a) => (a.id === area.id ? { ...a, ...area } : a))
            : [...state.areas, area],
        })),

      removeArea: (areaId: string) =>
        set((state) => ({
          areas: state.areas.filter((a) => a.id !== areaId),
        })),

      clearTables: () =>
        set({
          tables: [],
          areas: [],
          selectedAreaId: null,
          restaurantId: null,
          lastUpdated: null,
        }),
      
      reset: () => set(initialState),
    }),
    {
      name: "tablesStore",
      storage: createThrottledStorage(),
    },
  ),
);
