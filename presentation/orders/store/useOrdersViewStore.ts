import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type OrdersScope = "my-orders" | "all-orders";

// User-chosen customization of the orders module (set from the home screen's
// view options sheet). Persisted so it survives app restarts.
export interface OrdersViewStoreState {
  ordersScope: OrdersScope;
  setOrdersScope: (scope: OrdersScope) => void;
}

export const useOrdersViewStore = create<OrdersViewStoreState>()(
  persist(
    (set) => ({
      ordersScope: "my-orders",
      setOrdersScope: (ordersScope) => set({ ordersScope }),
    }),
    {
      name: "orders-view-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ ordersScope: state.ordersScope }),
    },
  ),
);
