import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ShakeToSyncState {
  /** Shaking the phone runs a sync. Saved per device, like the theme. */
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useShakeToSyncStore = create<ShakeToSyncState>()(
  persist(
    (set) => ({
      enabled: true,
      setEnabled: (enabled) => set({ enabled }),
    }),
    {
      name: "shake-to-sync-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ enabled: state.enabled }),
    },
  ),
);
