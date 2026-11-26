import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AsyncStorageAdapter } from "@/helpers/adapters/async-storage.adapter";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";
import { Order } from "@/core/orders/models/order.model";

/** Order actions that can be taken offline and sent later. */
export type OutboxEvent =
  | OrderSocketEvent.createOrder
  | OrderSocketEvent.addOrderDetail
  | OrderSocketEvent.addOrderDetails
  | OrderSocketEvent.updateOrder
  | OrderSocketEvent.updateOrderDetail
  | OrderSocketEvent.updateOrderDetails
  | OrderSocketEvent.deleteOrderDetail;

export type OutboxStatus = "pending" | "sending" | "failed";

export interface OutboxOperation {
  /** uuid, also sent as the operationId / idempotencyKey. */
  id: string;
  restaurantId: string;
  event: OutboxEvent;
  /** The same DTO the socket event takes, with operationId already set. */
  payload: Record<string, unknown>;
  orderId: string;
  /** What the order was called when queued, to describe it to the user. */
  orderLabel: string;
  /** Short description of the action, e.g. "Agregar 2 productos". */
  summary: string;
  /** Print the server's comanda when it's sent (online at queue time). */
  printOnSuccess: boolean;
  /**
   * The comanda was printed on the phone while the server was slow to
   * answer: once it answers, mark its ticket printed instead of printing it.
   */
  markTicketsPrinted?: boolean;
  createdAt: number;
  status: OutboxStatus;
  attempts: number;
  error?: { code?: string; msg: string };
}

interface OutboxState {
  operations: OutboxOperation[];
  /**
   * The server's latest version of each order that has queued actions. What
   * the phone shows is this plus the queued actions replayed on top, so a
   * rejected action can be taken back and changes from other phones still
   * show while actions wait.
   */
  bases: Record<string, Order>;
  setBase: (order: Order) => void;
  dropBase: (orderId: string) => void;
  /** Changes fields of a queued operation (not its status). */
  patch: (
    id: string,
    changes: Partial<
      Pick<OutboxOperation, "printOnSuccess" | "markTicketsPrinted">
    >,
  ) => void;
  enqueue: (
    operation: Omit<OutboxOperation, "status" | "attempts" | "createdAt">,
  ) => void;
  setStatus: (
    id: string,
    status: OutboxStatus,
    error?: OutboxOperation["error"],
  ) => void;
  remove: (id: string) => void;
  /** Drops every queued operation of one order. */
  removeOrder: (orderId: string) => void;
  /**
   * Points the queued operations of a local order at the server's order,
   * when the server answered a create with an order it already had.
   */
  remapOrder: (fromOrderId: string, toOrderId: string) => void;
  /** Drops every queued operation (logout). */
  clear: () => void;
}

export const useOutboxStore = create<OutboxState>()(
  persist(
    (set) => ({
      operations: [],
      bases: {},

      setBase: (order) =>
        set((state) => ({ bases: { ...state.bases, [order.id]: order } })),

      dropBase: (orderId) =>
        set((state) => {
          if (!state.bases[orderId]) return state;
          const { [orderId]: _dropped, ...bases } = state.bases;
          return { bases };
        }),

      patch: (id, changes) =>
        set((state) => ({
          operations: state.operations.map((op) =>
            op.id === id ? { ...op, ...changes } : op,
          ),
        })),

      enqueue: (operation) =>
        set((state) => ({
          // The same operation twice (e.g. a double tap) would be sent once
          // but leave a second local copy behind.
          operations: state.operations.some((op) => op.id === operation.id)
            ? state.operations
            : [
                ...state.operations,
                {
                  ...operation,
                  status: "pending",
                  attempts: 0,
                  createdAt: Date.now(),
                },
              ],
        })),

      setStatus: (id, status, error) =>
        set((state) => ({
          operations: state.operations.map((op) =>
            op.id === id
              ? {
                  ...op,
                  status,
                  error,
                  attempts:
                    status === "sending" ? op.attempts + 1 : op.attempts,
                }
              : op,
          ),
        })),

      remove: (id) =>
        set((state) => ({
          operations: state.operations.filter((op) => op.id !== id),
        })),

      removeOrder: (orderId) =>
        set((state) => {
          const { [orderId]: _dropped, ...bases } = state.bases;
          return {
            operations: state.operations.filter((op) => op.orderId !== orderId),
            bases,
          };
        }),

      remapOrder: (fromOrderId, toOrderId) =>
        set((state) => ({
          operations: state.operations.map((op) => {
            if (op.orderId !== fromOrderId) return op;
            const payload = { ...op.payload };
            if (payload.orderId === fromOrderId) payload.orderId = toOrderId;
            if (
              op.event === OrderSocketEvent.updateOrder &&
              payload.id === fromOrderId
            )
              payload.id = toOrderId;
            return { ...op, orderId: toOrderId, payload };
          }),
        })),

      clear: () => set({ operations: [], bases: {} }),
    }),
    {
      name: "outboxStore",
      storage: createJSONStorage(() => AsyncStorageAdapter),
      // A send in progress when the app was killed is retried on start.
      onRehydrateStorage: () => (state) => {
        state?.operations.forEach((op) => {
          if (op.status === "sending") state.setStatus(op.id, "pending");
        });
      },
    },
  ),
);

/** Operations of the current restaurant, oldest first. */
export const selectRestaurantOperations =
  (restaurantId?: string) => (state: OutboxState) =>
    state.operations.filter((op) => op.restaurantId === restaurantId);

/**
 * Actions still waiting to be sent (pending or sending). Rejected ones don't
 * count: they wait for the user and don't hold anything else back.
 */
export const hasPendingOperations = (restaurantId?: string) =>
  useOutboxStore
    .getState()
    .operations.some(
      (op) => op.restaurantId === restaurantId && op.status !== "failed",
    );

export const orderHasPendingOperations = (orderId: string) =>
  useOutboxStore
    .getState()
    .operations.some((op) => op.orderId === orderId && op.status !== "failed");

/** Any queued action for the order, rejected ones included. */
export const orderHasOperations = (orderId: string) =>
  useOutboxStore.getState().operations.some((op) => op.orderId === orderId);

/**
 * Resolves true once nothing is waiting to be sent for the restaurant, or
 * false after `timeoutMs`. Actions that need the server's answer first
 * (with a loader) wait for the queue, so they never overtake it.
 */
export const waitForOutboxDrain = (
  restaurantId: string | undefined,
  timeoutMs = 10000,
): Promise<boolean> => {
  if (!hasPendingOperations(restaurantId)) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      unsubscribe();
      resolve(false);
    }, timeoutMs);
    const unsubscribe = useOutboxStore.subscribe(() => {
      if (hasPendingOperations(restaurantId)) return;
      clearTimeout(timer);
      unsubscribe();
      resolve(true);
    });
  });
};
