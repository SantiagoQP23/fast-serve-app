import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Choices the product form remembers on this phone to prefill the next product.
export interface MenuFormStoreState {
  lastProductionAreaId: number | null;
  setLastProductionAreaId: (id: number) => void;
}

export const useMenuFormStore = create<MenuFormStoreState>()(
  persist(
    (set) => ({
      lastProductionAreaId: null,
      setLastProductionAreaId: (lastProductionAreaId) =>
        set({ lastProductionAreaId }),
    }),
    {
      name: "menu-form-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
