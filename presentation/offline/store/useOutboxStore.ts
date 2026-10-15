import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AsyncStorageAdapter } from "@/helpers/adapters/async-storage.adapter";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";

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
  createdAt: number;
  status: OutboxStatus;
  attempts: number;
  error?: { code?: string; msg: string };
}

interface OutboxState {
  operations: OutboxOperation[];
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
  /** Drops every queued operation (logout). */
  clear: () => void;
}

export const useOutboxStore = create<OutboxState>()(
  persist(
    (set) => ({
      operations: [],

      enqueue: (operation) =>
        set((state) => ({
          operations: [
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
        set((state) => ({
          operations: state.operations.filter((op) => op.orderId !== orderId),
        })),

      clear: () => set({ operations: [] }),
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

export const hasPendingOperations = (restaurantId?: string) =>
  useOutboxStore
    .getState()
    .operations.some((op) => op.restaurantId === restaurantId);

export const orderHasPendingOperations = (orderId: string) =>
  useOutboxStore.getState().operations.some((op) => op.orderId === orderId);
