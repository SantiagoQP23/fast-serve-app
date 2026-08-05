import { Bill } from "@/core/orders/models/bill.model";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import { Order } from "@/core/orders/models/order.model";
import { Account } from "@/core/restaurant/models/account.model";
import { PaymentMethod } from "@/core/restaurant/models/payment-method.model";
import { Transaction } from "@/core/transactions/models/transaction.model";
import { create } from "zustand";

export interface PendingProofImage {
  uri: string;
  fileName: string;
  mimeType: string;
}

interface OrdersState {
  orders: Order[];
  activeOrder: Order | null;
  activeBill: Bill | null;
  activeOrderDetail: OrderDetail | null;
  billDiscount: string;
  billAmount: string;
  billReceivedAmount: string;
  billTransferNote: string;
  selectedPaymentMethod: PaymentMethod | null;
  selectedAccount: Account | null;
  activePendingTransaction: Transaction | null;
  pendingProofImage: PendingProofImage | null;
  setOrders: (orders: Order[]) => void;
  setActiveOrder: (order: Order | null) => void;
  setActiveBill: (bill: Bill | null) => void;
  setActiveOrderDetail: (detail: OrderDetail | null) => void;
  setBillDiscount: (discount: string) => void;
  setBillAmount: (amount: string) => void;
  setBillReceivedAmount: (amount: string) => void;
  setBillTransferNote: (note: string) => void;
  setSelectedPaymentMethod: (method: PaymentMethod | null) => void;
  setSelectedAccount: (account: Account | null) => void;
  setActivePendingTransaction: (transaction: Transaction | null) => void;
  setPendingProofImage: (image: PendingProofImage | null) => void;
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
  billDiscount: "",
  billAmount: "",
  billReceivedAmount: "",
  billTransferNote: "",
  selectedPaymentMethod: null,
  selectedAccount: null,
  activePendingTransaction: null,
  pendingProofImage: null,
};

export const useOrdersStore = create<OrdersState>((set) => ({
  ...initialState,
  setOrders: (orders: Order[]) => set({ orders }),
  addOrder: (order: Order) =>
    set((state) => ({
      orders: state.orders.findLast((o) => o.id === order.id)
        ? [...state.orders]
        : [...state.orders, order],
    })),
  updateOrder: (order: Order) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === order.id ? order : o)),
    })),
  setActiveOrder: (order: Order | null) => set({ activeOrder: order }),
  setActiveBill: (bill: Bill | null) => set({ activeBill: bill }),
  setActiveOrderDetail: (detail: OrderDetail | null) =>
    set({ activeOrderDetail: detail }),
  setBillDiscount: (discount: string) => set({ billDiscount: discount }),
  setBillAmount: (amount: string) => set({ billAmount: amount }),
  setBillReceivedAmount: (amount: string) =>
    set({ billReceivedAmount: amount }),
  setBillTransferNote: (note: string) => set({ billTransferNote: note }),
  setSelectedPaymentMethod: (method: PaymentMethod | null) =>
    set({ selectedPaymentMethod: method }),
  setSelectedAccount: (account: Account | null) =>
    set({ selectedAccount: account }),
  setActivePendingTransaction: (transaction: Transaction | null) =>
    set({ activePendingTransaction: transaction }),
  setPendingProofImage: (image: PendingProofImage | null) =>
    set({ pendingProofImage: image }),
  deleteOrder: (orderId: string) =>
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== orderId),
    })),
  reset: () => set(initialState),
}));
