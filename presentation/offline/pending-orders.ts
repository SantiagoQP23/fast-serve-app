import { Order } from "@/core/orders/models/order.model";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";
import { useOutboxStore } from "./store/useOutboxStore";
import { fromServerOrder } from "./rebase";

/**
 * The open orders from a snapshot, with this phone's queued actions on top
 * of each. Orders the server doesn't have yet (created on this phone, still
 * queued) are kept as they are.
 */
export const keepLocalPendingOrders = (serverOrders: Order[]): Order[] => {
  const { operations } = useOutboxStore.getState();
  if (operations.length === 0) return serverOrders;

  const serverIds = new Set(serverOrders.map((order) => order.id));
  const notOnServer = new Set(
    operations
      .filter(
        (op) =>
          !serverIds.has(op.orderId) &&
          // Created here and not sent yet; an order the server closed has
          // nothing left to show once its actions were rejected.
          (op.event === OrderSocketEvent.createOrder || op.status !== "failed"),
      )
      .map((op) => op.orderId),
  );
  const local = useOrdersStore
    .getState()
    .orders.filter((order) => notOnServer.has(order.id));

  return [...serverOrders.map(fromServerOrder), ...local];
};

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
