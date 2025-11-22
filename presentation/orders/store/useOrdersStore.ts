import { OrderDetail } from "@/core/orders/models/order-detail.model";
import { Order } from "@/core/orders/models/order.model";
import { create } from "zustand";

interface OrdersState {
  orders: Order[];
  activeOrder: Order | null;
  activeOrderDetail: OrderDetail | null;
  setOrders: (orders: Order[]) => void;
  setActiveOrder: (order: Order | null) => void;
  setActiveOrderDetail: (detail: OrderDetail | null) => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],
  activeOrder: null,
  activeOrderDetail: null,
  setOrders: (orders: Order[]) => set({ orders }),
  setActiveOrder: (order: Order | null) => set({ activeOrder: order }),
  setActiveOrderDetail: (detail: OrderDetail | null) =>
    set({ activeOrderDetail: detail }),
}));
