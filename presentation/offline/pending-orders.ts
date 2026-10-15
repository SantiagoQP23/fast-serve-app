import { Order } from "@/core/orders/models/order.model";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import {
  orderHasPendingOperations,
  useOutboxStore,
} from "./store/useOutboxStore";

/**
 * Orders with actions still in the outbox keep their local copy: the server's
 * version doesn't have those actions yet (or the order itself, if it was
 * created offline). The ack of the last queued action brings the server's
 * version back.
 */
export const keepLocalPendingOrders = (serverOrders: Order[]): Order[] => {
  const pendingIds = new Set(
    useOutboxStore.getState().operations.map((op) => op.orderId),
  );
  if (pendingIds.size === 0) return serverOrders;

  const local = useOrdersStore
    .getState()
    .orders.filter((order) => pendingIds.has(order.id));
  const localIds = new Set(local.map((order) => order.id));

  return [
    ...serverOrders.filter((order) => !localIds.has(order.id)),
    ...local,
  ];
};

/** A sync event for this order would undo changes that are still queued. */
export const shouldSkipOrderSyncEvent = (orderId: string) =>
  orderHasPendingOperations(orderId);
