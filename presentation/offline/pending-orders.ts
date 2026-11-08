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

/**
 * Orders being created offline right now, by operationId (the cart's
 * idempotencyKey). The local order is saved before the comanda prints and
 * the action is queued, so a second tap on "Crear pedido" in that gap would
 * make another local copy of the same order.
 */
const ordersBeingCreated = new Map<string, string>();

/** Claims the create; false when the same create is already under way. */
export const startCreatingOrder = (operationId: string, orderId: string) => {
  const alreadyQueued = useOutboxStore
    .getState()
    .operations.some((op) => op.id === operationId);
  if (alreadyQueued || ordersBeingCreated.has(operationId)) return false;
  ordersBeingCreated.set(operationId, orderId);
  return true;
};

export const finishCreatingOrder = (operationId: string) => {
  ordersBeingCreated.delete(operationId);
};

/**
 * Local orders the server never got: no number yet and nothing left in the
 * outbox for them (e.g. extra copies left by an older version after a double
 * tap). They'd stay on the phone forever, since the server has no events for
 * them. Called once the outbox is empty and the app has synced.
 */
export const dropOrphanLocalOrders = () => {
  const { operations } = useOutboxStore.getState();
  const queuedIds = new Set(operations.map((op) => op.orderId));
  const creatingIds = new Set(ordersBeingCreated.values());

  const store = useOrdersStore.getState();
  const orphans = store.orders.filter(
    (order) =>
      !order.num && !queuedIds.has(order.id) && !creatingIds.has(order.id),
  );
  orphans.forEach((order) => store.deleteOrder(order.id));
};
