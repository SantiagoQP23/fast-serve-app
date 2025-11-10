import { NewOrderDetail } from "@/core/orders/dto/new-order-detail.dto";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { Table } from "@/core/tables/models/table.model";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { create } from "zustand";
import { createJSONStorage, persist, PersistStorage } from "zustand/middleware";

interface NewOrderState {
  table: Table | null;
  amount: number;
  details: NewOrderDetail[];
  people: number;
  orderType: OrderType;
  totalProducts: number;
  notes: string;
  deliveryTime: Date | null;
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
        const index = details.findIndex(
          (d) => d.product.id === detail.product.id,
        );
        if (index !== -1) {
          details.splice(index, 1);
          set({ details });
        }
      },

      updateDetail: (detail: NewOrderDetail) => {
        const details = get().details;

        const index = details.findIndex(
          (d) => d.product.id === detail.product.id,
          // d.productOption?.id === detail.productOption?.id,
        );

        if (index !== -1) {
          const updatedDetail = {
            ...details[index],
            quantity: detail.quantity,
            description: detail.description,
            // productOption: detail.productOption,
          };

          details[index] = updatedDetail;
          set({ details });
        }
      },

      setPeople: (people: number) => set({ people }),
      setOrderType: (orderType: OrderType) => set({ orderType }),
      setTotalProducts: (totalProducts: number) => set({ totalProducts }),
      setNotes: (notes: string) => set({ notes }),
      setDeliveryTime: (deliveryTime: Date | null) => set({ deliveryTime }),

      reset: () => set(initialState),
    }),
    {
      name: "newOrderStore",
      // storage: () => SecureStorageAdapter,
      storage: createJSONStorage(() => SecureStorageAdapter),
    },
  ),
);
