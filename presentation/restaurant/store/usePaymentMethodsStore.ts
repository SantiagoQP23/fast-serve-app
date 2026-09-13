import { PaymentMethod } from "@/core/restaurant/models/payment-method.model";
import { AsyncStorageAdapter } from "@/helpers/adapters/async-storage.adapter";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface PaymentMethodsState {
  paymentMethods: PaymentMethod[];
  restaurantId: string | null;
  lastUpdated: number | null;
}

interface PaymentMethodsActions {
  setPaymentMethods: (
    paymentMethods: PaymentMethod[],
    restaurantId: string,
  ) => void;
  upsertPaymentMethod: (paymentMethod: PaymentMethod) => void;
  removePaymentMethod: (id: number) => void;
  clearPaymentMethods: () => void;
  reset: () => void;
}

const initialState: PaymentMethodsState = {
  paymentMethods: [],
  restaurantId: null,
  lastUpdated: null,
};

export const usePaymentMethodsStore = create<
  PaymentMethodsState & PaymentMethodsActions
>()(
  persist(
    (set) => ({
      ...initialState,
      setPaymentMethods: (paymentMethods, restaurantId) =>
        set({ paymentMethods, restaurantId, lastUpdated: Date.now() }),

      upsertPaymentMethod: (paymentMethod) =>
        set((state) => {
          const exists = state.paymentMethods.some(
            (p) => p.id === paymentMethod.id,
          );
          return {
            paymentMethods: exists
              ? state.paymentMethods.map((p) =>
                  p.id === paymentMethod.id ? paymentMethod : p,
                )
              : [...state.paymentMethods, paymentMethod],
            lastUpdated: Date.now(),
          };
        }),

      removePaymentMethod: (id) =>
        set((state) => ({
          paymentMethods: state.paymentMethods.filter((p) => p.id !== id),
          lastUpdated: Date.now(),
        })),

      clearPaymentMethods: () =>
        set({ paymentMethods: [], restaurantId: null, lastUpdated: null }),
      reset: () => set(initialState),
    }),
    {
      name: "paymentMethodsStore",
      storage: createJSONStorage(() => AsyncStorageAdapter),
    },
  ),
);
