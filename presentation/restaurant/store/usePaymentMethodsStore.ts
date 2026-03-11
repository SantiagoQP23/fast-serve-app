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
