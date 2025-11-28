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
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],
  activeOrder: null,
  activeBill: null,
  activeOrderDetail: null,
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
}));
