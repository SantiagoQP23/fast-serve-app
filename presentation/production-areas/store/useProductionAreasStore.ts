import { ProductionArea } from "@/core/menu/models/producion-area.model";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AsyncStorageAdapter } from "@/helpers/adapters/async-storage.adapter";

export interface ProductionAreasState {
  productionAreas: ProductionArea[];
  restaurantId: string | null;
  lastUpdated: number | null;
}

interface ProductionAreasActions {
  setProductionAreas: (areas: ProductionArea[], restaurantId: string) => void;
  upsertProductionArea: (area: ProductionArea) => void;
  removeProductionArea: (id: number) => void;
  clearProductionAreas: () => void;
  reset: () => void;
}

const initialState: ProductionAreasState = {
  productionAreas: [],
  restaurantId: null,
  lastUpdated: null,
};

export const useProductionAreasStore = create<
  ProductionAreasState & ProductionAreasActions
>()(
  persist(
    (set) => ({
      ...initialState,

      setProductionAreas: (areas: ProductionArea[], restaurantId: string) =>
        set({
          productionAreas: areas,
          restaurantId,
          lastUpdated: Date.now(),
        }),

      upsertProductionArea: (area: ProductionArea) =>
        set((state) => {
          const exists = state.productionAreas.some((a) => a.id === area.id);
          return {
            productionAreas: exists
              ? state.productionAreas.map((a) =>
                  a.id === area.id ? area : a,
                )
              : [...state.productionAreas, area],
            lastUpdated: Date.now(),
          };
        }),

      removeProductionArea: (id: number) =>
        set((state) => ({
          productionAreas: state.productionAreas.filter((a) => a.id !== id),
          lastUpdated: Date.now(),
        })),

      clearProductionAreas: () =>
        set({
          productionAreas: [],
          restaurantId: null,
          lastUpdated: null,
        }),

      reset: () => set(initialState),
    }),
    {
      name: "productionAreasStore",
      storage: createJSONStorage(() => AsyncStorageAdapter),
    },
  ),
);
