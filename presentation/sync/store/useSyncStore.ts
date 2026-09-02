import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AsyncStorageAdapter } from "@/helpers/adapters/async-storage.adapter";

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

export interface SyncState {
  restaurantId: string | null;
  lastSequence: number;
  status: SyncStatus;
  lastSyncedAt: number | null;
}

interface SyncActions {
  setRestaurantId: (restaurantId: string | null) => void;
  startSync: () => void;
  setSynced: (lastSequence: number) => void;
  setError: () => void;
  reset: () => void;
}

const initialState: SyncState = {
  restaurantId: null,
  lastSequence: 0,
  status: "idle",
  lastSyncedAt: null,
};

export const useSyncStore = create<SyncState & SyncActions>()(
  persist(
    (set) => ({
      ...initialState,

      setRestaurantId: (restaurantId: string | null) =>
        set({
          restaurantId,
          lastSequence: 0,
          status: "idle",
          lastSyncedAt: null,
        }),

      startSync: () => set({ status: "syncing" }),

      setSynced: (lastSequence: number) =>
        set({
          status: "synced",
          lastSequence,
          lastSyncedAt: Date.now(),
        }),

      setError: () => set({ status: "error" }),

      reset: () => set(initialState),
    }),
    {
      name: "syncStore",
      storage: createJSONStorage(() => AsyncStorageAdapter),
    },
  ),
);
