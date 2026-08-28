import { Printer } from "@/core/common/models/printer.model";
import { AsyncStorageAdapter } from "@/helpers/adapters/async-storage.adapter";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface PrintersState {
  printers: Printer[];
  restaurantId: string | null;
  lastUpdated: number | null;
}

interface PrintersActions {
  setPrinters: (printers: Printer[], restaurantId: string) => void;
  clearPrinters: () => void;
  reset: () => void;
}

const initialState: PrintersState = {
  printers: [],
  restaurantId: null,
  lastUpdated: null,
};

export const usePrintersStore = create<PrintersState & PrintersActions>()(
  persist(
    (set) => ({
      ...initialState,
      setPrinters: (printers: Printer[], restaurantId: string) =>
        set({ printers, restaurantId, lastUpdated: Date.now() }),
      clearPrinters: () =>
        set({ printers: [], restaurantId: null, lastUpdated: null }),
      reset: () => set(initialState),
    }),
    {
      name: "printersStore",
      storage: createJSONStorage(() => AsyncStorageAdapter),
    },
  ),
);
