import { rowsFromPayload } from "@/core/menu/models/customization.model";
import { Order } from "@/core/orders/models/order.model";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";
import { CreateOrderDetailDto } from "@/core/orders/dto/create-order.dto";
import {
  OrderDetailBatchItemDto,
  UpdateOrderDetailDto,
  UpdateOrderDetailsDto,
  UpdateOrderDto,
} from "@/core/orders/dto/update-order.dto";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { OutboxOperation, useOutboxStore } from "./store/useOutboxStore";
import {
  addLocalDetails,
  applyLocalDetailRemoval,
  applyLocalDetailUpdate,
  applyLocalOrderUpdate,
  buildLocalDetail,
} from "./local-order";

/**
 * What the phone shows for an order with queued actions: the server's latest
 * version (its "base") with those actions replayed on top. A rejected action
 * is left out, so it disappears from the screen; changes other phones made
 * to the base still show while this phone's actions wait.
 */

/** A line as the phone shows it before the server has it. */
export const buildQueuedDetail = (
  item: CreateOrderDetailDto | OrderDetailBatchItemDto,
  id: string,
): OrderDetail | null => {
  const product = useMenuStore
    .getState()
    .products.find((p) => p.id === item.productId);
  if (!product) return null;

  return buildLocalDetail(
    {
      id,
      product,
      productOption: product.options?.find(
        (option) => option.id === item.productOptionId,
      ),
      quantity: item.quantity,
      price: item.price,
      description: item.description,
      tagIds: "tagIds" in item ? item.tagIds : undefined,
      typeOrderDetail: item.typeOrderDetail,
      modifiers: rowsFromPayload(item.customization),
    },
    useAuthStore.getState().user,
  );
};

const newDetails = (
  items: (OrderDetailBatchItemDto & { id?: string })[],
): OrderDetail[] =>
  items
    .map((item) => (item.id ? buildQueuedDetail(item, item.id) : null))
    .filter((detail): detail is OrderDetail => !!detail);

/**
 * Applies one queued action to an order. Every action is safe to apply to
 * a version that already has it (lines are added by id, the rest set
 * values), since the server may have applied it before its answer arrived.
 */
export const replayOperation = (order: Order, op: OutboxOperation): Order => {
  const payload = op.payload as Record<string, unknown>;

  switch (op.event) {
    // The base is the server's order, so the order exists there already.
    case OrderSocketEvent.createOrder:
      return order;
    case OrderSocketEvent.addOrderDetails:
      return addLocalDetails(
        order,
        newDetails(payload.newDetails as OrderDetailBatchItemDto[]),
      );
    case OrderSocketEvent.addOrderDetail:
      return addLocalDetails(
        order,
        newDetails([payload as unknown as OrderDetailBatchItemDto]),
      );
    case OrderSocketEvent.updateOrderDetail:
      return applyLocalDetailUpdate(
        order,
        payload as unknown as UpdateOrderDetailDto,
      );
    case OrderSocketEvent.updateOrderDetails:
      return (payload as unknown as UpdateOrderDetailsDto).details.reduce(
        (acc, detail) => applyLocalDetailUpdate(acc, detail),
        order,
      );
    case OrderSocketEvent.deleteOrderDetail:
      return applyLocalDetailRemoval(order, payload.detailId as string);
    case OrderSocketEvent.updateOrder:
      return applyLocalOrderUpdate(
        order,
        payload as unknown as UpdateOrderDto,
        useTablesStore.getState().tables,
      );
    default:
      return order;
  }
};

/** The server's order with this phone's queued (not rejected) actions on top. */
export const rebaseOrder = (base: Order): Order =>
  useOutboxStore
    .getState()
    .operations.filter((op) => op.orderId === base.id && op.status !== "failed")
    .reduce(replayOperation, base);

/** Puts an order on screen: the orders list and, if it's open, the order screen. */
export const showOrder = (order: Order) => {
  const store = useOrdersStore.getState();
  if (order.isClosed) {
    store.deleteOrder(order.id);
  } else if (store.orders.some((o) => o.id === order.id)) {
    store.updateOrder(order);
  } else {
    store.addOrder(order);
  }
  if (store.activeOrder?.id === order.id) store.setActiveOrder(order);
};

/**
 * A version of the order from the server (an answer, a sync event or a
 * snapshot). With actions still queued for it, it becomes the base and the
 * actions are replayed on top; otherwise it's shown as it is.
 */
export const fromServerOrder = (order: Order): Order => {
  const outbox = useOutboxStore.getState();
  const queued = outbox.operations.some((op) => op.orderId === order.id);
  if (!queued || order.isClosed) {
    outbox.dropBase(order.id);
    return order;
  }
  outbox.setBase(order);
  return rebaseOrder(order);
};

/**
 * Before the first queued action on an order: remember the server's
 * version, so the action can be taken back if the server rejects it.
 * Orders created on this phone have no server version yet.
 */
export const rememberBase = (order: Order) => {
  const outbox = useOutboxStore.getState();
  if (!order.num || outbox.bases[order.id]) return;
  if (outbox.operations.some((op) => op.orderId === order.id)) return;
  outbox.setBase(order);
};

/**
 * Shows the order again from its base after the queued actions changed (one
 * was rejected, retried or discarded). Without a base (an order created on
 * this phone) the local copy stays as it is.
 */
export const refreshOrderView = (orderId: string) => {
  const outbox = useOutboxStore.getState();
  const base = outbox.bases[orderId];
  if (!base) return;
  if (!outbox.operations.some((op) => op.orderId === orderId)) {
    outbox.dropBase(orderId);
  }
  showOrder(rebaseOrder(base));
};
