import { Bill } from "@/core/orders/models/bill.model";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import { Order } from "@/core/orders/models/order.model";
import { Product } from "@/core/menu/models/product.model";
import { Account } from "@/core/restaurant/models/account.model";
import { PaymentMethod } from "@/core/restaurant/models/payment-method.model";
import { Transaction } from "@/core/transactions/models/transaction.model";
import { AsyncStorageAdapter } from "@/helpers/adapters/async-storage.adapter";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
  billRequestApproval: boolean;
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
  setBillRequestApproval: (requestApproval: boolean) => void;
  setSelectedPaymentMethod: (method: PaymentMethod | null) => void;
  setSelectedAccount: (account: Account | null) => void;
  setActivePendingTransaction: (transaction: Transaction | null) => void;
  setPendingProofImage: (image: PendingProofImage | null) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  deleteOrder: (orderId: string) => void;
  updateProductInOrders: (product: Product) => void;
  updateProductsInOrders: (products: Product[]) => void;
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
  billRequestApproval: true,
  selectedPaymentMethod: null,
  selectedAccount: null,
  activePendingTransaction: null,
  pendingProofImage: null,
};

// Igual que el servidor: cuando sale el último pedido abierto de una mesa, la
// mesa queda disponible. Así se ve bien aunque el teléfono esté sin conexión.
const freeTableIfEmpty = (tableId: string | undefined, orders: Order[]) => {
  if (!tableId) return;
  if (orders.some((o) => o.table?.id === tableId && !o.isClosed)) return;
  const { tables, updateTable } = useTablesStore.getState();
  const table = tables.find((t) => t.id === tableId);
  if (table?.isAvailable === false)
    updateTable({ ...table, isAvailable: true });
};

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setOrders: (orders: Order[]) => set({ orders }),
      addOrder: (order: Order) =>
        set((state) => ({
          orders: state.orders.findLast((o) => o.id === order.id)
            ? [...state.orders]
            : [...state.orders, order],
        })),
      updateOrder: (order: Order) => {
        const previous = get().orders.find((o) => o.id === order.id);
        set((state) => ({
          orders: state.orders.map((o) => (o.id === order.id ? order : o)),
        }));
        if (order.isClosed || previous?.table?.id !== order.table?.id) {
          freeTableIfEmpty(previous?.table?.id, get().orders);
        }
      },
      setActiveOrder: (order: Order | null) => set({ activeOrder: order }),
      setActiveBill: (bill: Bill | null) => set({ activeBill: bill }),
      setActiveOrderDetail: (detail: OrderDetail | null) =>
        set({ activeOrderDetail: detail }),
      setBillDiscount: (discount: string) => set({ billDiscount: discount }),
      setBillAmount: (amount: string) => set({ billAmount: amount }),
      setBillReceivedAmount: (amount: string) =>
        set({ billReceivedAmount: amount }),
      setBillTransferNote: (note: string) => set({ billTransferNote: note }),
      setBillRequestApproval: (requestApproval: boolean) =>
        set({ billRequestApproval: requestApproval }),
      setSelectedPaymentMethod: (method: PaymentMethod | null) =>
        set({ selectedPaymentMethod: method }),
      setSelectedAccount: (account: Account | null) =>
        set({ selectedAccount: account }),
      setActivePendingTransaction: (transaction: Transaction | null) =>
        set({ activePendingTransaction: transaction }),
      setPendingProofImage: (image: PendingProofImage | null) =>
        set({ pendingProofImage: image }),
      deleteOrder: (orderId: string) => {
        const removed = get().orders.find((o) => o.id === orderId);
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== orderId),
        }));
        freeTableIfEmpty(removed?.table?.id, get().orders);
      },
      updateProductInOrders: (product: Product) =>
        get().updateProductsInOrders([product]),

      // Only orders that contain one of the products change, so the rest
      // keep their identity and don't re-render.
      updateProductsInOrders: (products: Product[]) =>
        set((state) => {
          const byId = new Map(products.map((p) => [p.id, p]));
          const replaceInDetails = (details: OrderDetail[]) =>
            details.some((d) => d.product?.id && byId.has(d.product.id))
              ? details.map((d) =>
                  d.product?.id && byId.has(d.product.id)
                    ? { ...d, product: byId.get(d.product.id)! }
                    : d,
                )
              : details;
          const replaceInOrder = (o: Order) => {
            const details = replaceInDetails(o.details);
            return details === o.details ? o : { ...o, details };
          };

          const orders = state.orders.map(replaceInOrder);
          const activeOrder = state.activeOrder
            ? replaceInOrder(state.activeOrder)
            : state.activeOrder;
          const detailProduct = state.activeOrderDetail?.product?.id
            ? byId.get(state.activeOrderDetail.product.id)
            : undefined;
          const activeOrderDetail = detailProduct
            ? { ...state.activeOrderDetail!, product: detailProduct }
            : state.activeOrderDetail;

          if (
            orders.every((o, i) => o === state.orders[i]) &&
            activeOrder === state.activeOrder &&
            activeOrderDetail === state.activeOrderDetail
          )
            return state;

          return { orders, activeOrder, activeOrderDetail };
        }),
      reset: () => set(initialState),
    }),
    {
      name: "ordersStore",
      storage: createJSONStorage(() => AsyncStorageAdapter),
    },
  ),
);
