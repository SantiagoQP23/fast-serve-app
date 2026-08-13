import { create } from "zustand";
import { NewOrderDetail } from "@/core/orders/dto/new-order-detail.dto";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import { Order } from "@/core/orders/models/order.model";

export interface EditOrderCartState {
  orderId: string | null;
  originalDetails: OrderDetail[];
  newItems: NewOrderDetail[];
  modifiedItems: Record<string, Partial<OrderDetail>>;
  removedIds: string[];
}

export interface EditOrderCartActions {
  init: (order: Order) => void;
  addNewItem: (detail: NewOrderDetail) => void;
  updateNewItem: (id: string, detail: Partial<NewOrderDetail>) => void;
  removeNewItem: (id: string) => void;
  modifyExistingItem: (id: string, changes: Partial<OrderDetail>) => void;
  markItemRemoved: (id: string) => void;
  restoreItem: (id: string) => void;
  getDelta: () => {
    newItems: NewOrderDetail[];
    modifiedItems: Record<string, Partial<OrderDetail>>;
    removedIds: string[];
  };
  getNewItemCount: () => number;
  reset: () => void;
}

const initialState: EditOrderCartState = {
  orderId: null,
  originalDetails: [],
  newItems: [],
  modifiedItems: {},
  removedIds: [],
};

export const useEditOrderCartStore = create<EditOrderCartState & EditOrderCartActions>()(
  (set, get) => ({
    ...initialState,

    init: (order: Order) => {
      set({
        orderId: order.id,
        originalDetails: order.details || [],
        newItems: [],
        modifiedItems: {},
        removedIds: [],
      });
    },

    addNewItem: (detail: NewOrderDetail) => {
      const current = get().newItems;
      const id = Math.random().toString(36).slice(2);
      set({ newItems: [...current, { ...detail, id }] });
    },

    updateNewItem: (id: string, changes: Partial<NewOrderDetail>) => {
      set((state) => ({
        newItems: state.newItems.map((item) =>
          item.id === id ? { ...item, ...changes } : item,
        ),
      }));
    },

    removeNewItem: (id: string) => {
      set((state) => ({
        newItems: state.newItems.filter((item) => item.id !== id),
      }));
    },

    modifyExistingItem: (id: string, changes: Partial<OrderDetail>) => {
      set((state) => ({
        modifiedItems: { ...state.modifiedItems, [id]: { ...(state.modifiedItems[id] || {}), ...changes } },
      }));
    },

    markItemRemoved: (id: string) => {
      const current = get().removedIds;
      if (!current.includes(id)) {
        set({ removedIds: [...current, id] });
      }
    },

    restoreItem: (id: string) => {
      set((state) => ({
        removedIds: state.removedIds.filter((rid) => rid !== id),
      }));
    },

    getDelta: () => {
      const state = get();
      return {
        newItems: state.newItems,
        modifiedItems: state.modifiedItems,
        removedIds: state.removedIds,
      };
    },

    getNewItemCount: () => {
      return get().newItems.length;
    },

    reset: () => set(initialState),
  }),
);
