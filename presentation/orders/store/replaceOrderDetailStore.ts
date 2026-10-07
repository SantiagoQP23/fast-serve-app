import { create } from "zustand";
import { OrderDetail } from "@/core/orders/models/order-detail.model";

/**
 * Tracks the order item being replaced while the user picks its
 * replacement in the restaurant menu. Not persisted: a replace that is
 * interrupted (app closed, menu left) simply doesn't happen.
 */
interface ReplaceOrderDetailState {
  orderId: string | null;
  detail: OrderDetail | null;
  start: (orderId: string, detail: OrderDetail) => void;
  reset: () => void;
}

export const useReplaceOrderDetailStore = create<ReplaceOrderDetailState>()(
  (set) => ({
    orderId: null,
    detail: null,
    start: (orderId, detail) => set({ orderId, detail }),
    reset: () => set({ orderId: null, detail: null }),
  }),
);
