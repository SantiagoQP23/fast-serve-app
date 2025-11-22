import { NewOrderDetail } from "@/core/orders/dto/new-order-detail.dto";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { Table } from "@/core/tables/models/table.model";
import { create } from "zustand";
import { createJSONStorage, persist, PersistStorage } from "zustand/middleware";
import { AsyncStorageAdapter } from "@/helpers/adapters/async-storage.adapter";

export interface NewOrderState {
  table: Table | null;
  amount: number;
  details: NewOrderDetail[];
  people: number;
  orderType: OrderType;
  totalProducts: number;
  notes: string;
  deliveryTime: Date | null;
  activeDetail: NewOrderDetail | null;
}

interface NewOrderActions {
  setTable: (table: Table | null) => void;
  setAmount: (amount: number) => void;
  setDetails: (details: NewOrderDetail[]) => void;
  setPeople: (people: number) => void;
  setOrderType: (orderType: OrderType) => void;
  setTotalProducts: (totalProducts: number) => void;
  setNotes: (notes: string) => void;
  setDeliveryTime: (deliveryTime: Date | null) => void;
  addDetail: (detail: NewOrderDetail) => void;
  removeDetail: (detail: NewOrderDetail) => void;
  updateDetail: (detail: NewOrderDetail) => void;
  setActiveDetail: (detail: NewOrderDetail | null) => void;

  reset: () => void;
}

const initialState: NewOrderState = {
  details: [],
  amount: 0,
  table: null,
  people: 0,
  orderType: OrderType.IN_PLACE,
  totalProducts: 0,
  notes: "",
  deliveryTime: new Date(),
  activeDetail: null,
};

export const useNewOrderStore = create<NewOrderState & NewOrderActions>()(
  persist(
    (set, get) => ({
      title: "New Order",
      ...initialState,

      setTable: (table: Table | null) => set({ table }),
      setAmount: (amount: number) => set({ amount }),
      setDetails: (details: NewOrderDetail[]) => set({ details }),

      addDetail: (detail: NewOrderDetail) => {
        const details = get().details;

        set({ details: [...details, detail] });
      },

      removeDetail: (detail: NewOrderDetail) => {
        const details = get().details;

        set({
          details: details.filter((d) => d.product.id !== detail.product.id),
        });
      },

      updateDetail: (detail: NewOrderDetail) => {
        const details = get().details;

        set({
          details: details.map((d) =>
            d.product.id === detail.product.id
              ? {
                  ...d,
                  quantity: detail.quantity,
                  description: detail.description,
                }
              : d,
          ),
        });
      },

      setPeople: (people: number) => set({ people }),
      setOrderType: (orderType: OrderType) => set({ orderType }),
      setTotalProducts: (totalProducts: number) => set({ totalProducts }),
      setNotes: (notes: string) => set({ notes }),
      setDeliveryTime: (deliveryTime: Date | null) => set({ deliveryTime }),
      setActiveDetail: (activeDetail: NewOrderDetail | null) =>
        set({ activeDetail }),

      reset: () => set(initialState),
    }),
    {
      name: "newOrderStore",
      // storage: () => SecureStorageAdapter,
      storage: createJSONStorage(() => AsyncStorageAdapter),
    },
  ),
);
