import { Bill } from "@/core/orders/models/bill.model";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import { Order } from "@/core/orders/models/order.model";
import { create } from "zustand";

interface OrdersState {
  orders: Order[];
  activeOrder: Order | null;
  activeBill: Bill | null;
  activeOrderDetail: OrderDetail | null;
  setOrders: (orders: Order[]) => void;
  setActiveOrder: (order: Order | null) => void;
  setActiveBill: (bill: Bill | null) => void;
  setActiveOrderDetail: (detail: OrderDetail | null) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  deleteOrder: (orderId: string) => void;
  reset: () => void;
}

const initialState = {
  orders: [],
  activeOrder: null,
  activeBill: null,
  activeOrderDetail: null,
};

export const useOrdersStore = create<OrdersState>((set) => ({
  ...initialState,
  setOrders: (orders: Order[]) => set({ orders }),
  addOrder: (order: Order) =>
    set((state) => ({
      orders: [...state.orders, order],
    })),
  updateOrder: (order: Order) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === order.id ? order : o)),
    })),
  setActiveOrder: (order: Order | null) => set({ activeOrder: order }),
  setActiveBill: (bill: Bill | null) => set({ activeBill: bill }),
  setActiveOrderDetail: (detail: OrderDetail | null) =>
    set({ activeOrderDetail: detail }),
  deleteOrder: (orderId: string) =>
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== orderId),
    })),
  reset: () => set(initialState),
}));
