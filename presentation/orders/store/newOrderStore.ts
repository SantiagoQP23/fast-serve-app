import { NewOrderDetail } from "@/core/orders/dto/new-order-detail.dto";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { Table } from "@/core/tables/models/table.model";
import { create } from "zustand";
import { createJSONStorage, persist, PersistStorage } from "zustand/middleware";
import { AsyncStorageAdapter } from "@/helpers/adapters/async-storage.adapter";

export type CartType = "order" | "sale";

export interface NewOrderState {
  cartType: CartType;
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
  setCartType: (type: CartType) => void;
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
  cartType: "order",
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
        const id = Math.random().toString(36).slice(2);
        set({ details: [...details, { ...detail, id }] });
      },

      removeDetail: (detail: NewOrderDetail) => {
        const details = get().details;
        set({
          details: details.filter((d) =>
            detail.id ? d.id !== detail.id : d.product.id !== detail.product.id,
          ),
        });
      },

      updateDetail: (detail: NewOrderDetail) => {
        const details = get().details;
        set({
          details: details.map((d) =>
            (
              detail.id
                ? d.id === detail.id
                : d.product.id === detail.product.id
            )
              ? {
                  ...d,
                  quantity: detail.quantity,
                  description: detail.description,
                  price: detail.price,
                  tagIds: detail.tagIds,
                }
              : d,
          ),
        });
      },

      setPeople: (people: number) => set({ people }),
      setOrderType: (orderType: OrderType) => set({ orderType }),
      setCartType: (type: CartType) => set({ cartType: type }),
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
