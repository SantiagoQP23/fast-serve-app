import { useCallback, useContext } from "react";
import { SocketContext } from "@/presentation/shared/context/SocketContext";
import { SocketResponseData } from "@/core/common/dto/socket.dto";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { generateIdempotencyKey } from "@/helpers/idempotency";
import { Order } from "@/core/orders/models/order.model";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";
import { Ticket } from "@/core/tickets/models/ticket.model";
import {
  CreateOrderDetailDto,
  CreateOrderDto,
} from "@/core/orders/dto/create-order.dto";
import {
  AddOrderDetailToOrderDto,
  AddOrderDetailsDto,
  DeleteOrderDetailDto,
  OrderDetailBatchItemDto,
  UpdateOrderDetailDto,
  UpdateOrderDetailsDto,
  UpdateOrderDto,
  UpdateOrderResp,
} from "@/core/orders/dto/update-order.dto";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { usePrintComanda } from "@/presentation/orders/hooks/usePrintComanda";
import {
  OutboxEvent,
  hasPendingOperations,
  useOutboxStore,
} from "../store/useOutboxStore";
import {
  addLocalDetails,
  applyLocalDetailRemoval,
  applyLocalDetailUpdate,
  applyLocalOrderUpdate,
  buildLocalDetail,
  buildLocalOrder,
  isOrderNumberPending,
} from "../local-order";
import {
  buildLocalAddTicket,
  buildLocalCancelTicket,
  buildLocalNewTicket,
  buildLocalUpdateTicket,
} from "../local-ticket";

export interface QueueOptions<TData> {
  onSuccess?: (resp: SocketResponseData<TData>) => void;
  onError?: (resp: { ok: boolean; msg: string }) => void;
  /** Create order only: print the comanda (the "create and print" button). */
  print?: boolean;
}

/** Fields of update-order that can wait offline; anything else needs the server. */
const QUEUEABLE_ORDER_FIELDS = new Set([
  "id",
  "people",
  "notes",
  "deliveryTime",
  "tableId",
  "typeOrder",
]);

export const isQueueableOrderUpdate = (dto: UpdateOrderDto) =>
  Object.keys(dto).every((key) => QUEUEABLE_ORDER_FIELDS.has(key));

/**
 * Order actions taken without a connection (or while earlier ones still wait
 * to be sent): applied to the local order right away, comanda printed from
 * the phone, and queued in the outbox so useOutboxRunner sends them in order.
 */
export const useOrderOutbox = () => {
  const { socket } = useContext(SocketContext);
  const { t } = useTranslation(["orders"]);
  const { printComanda } = usePrintComanda();

  const restaurantId = useAuthStore((state) => state.currentRestaurant?.id);

  /** Queue instead of sending when offline, or to keep the order of actions. */
  const shouldQueue = useCallback(
    () => !socket?.connected || hasPendingOperations(restaurantId),
    [socket, restaurantId],
  );

  const orderLabel = (order: Order) => {
    const place = order.table
      ? t("orders:offline.orderAtTable", { table: order.table.name })
      : t("orders:offline.orderTakeAway");
    return isOrderNumberPending(order)
      ? place
      : `${t("orders:details.orderNumber", { num: order.num })} · ${place}`;
  };

  const findOrder = (orderId: string): Order | undefined => {
    const { orders, activeOrder } = useOrdersStore.getState();
    return (
      orders.find((order) => order.id === orderId) ??
      (activeOrder?.id === orderId ? activeOrder : undefined)
    );
  };

  const saveOrder = (order: Order) => {
    const store = useOrdersStore.getState();
    if (store.orders.some((o) => o.id === order.id)) store.updateOrder(order);
    else store.addOrder(order);
    if (store.activeOrder?.id === order.id) store.setActiveOrder(order);
  };

  /**
   * Prints a comanda built on the phone. Only when offline: with a
   * connection the runner prints the server's ticket after sending.
   * Returns `ticketPrinted` for the payload, or undefined when nothing was
   * printed here.
   */
  const printLocally = async (
    order: Order,
    ticket: Ticket | null,
  ): Promise<boolean | undefined> => {
    if (!ticket || socket?.connected) return undefined;
    return printComanda(order, ticket, { markPrinted: false });
  };

  const enqueue = (input: {
    id: string;
    event: OutboxEvent;
    payload: object;
    order: Order;
    summary: string;
    printOnSuccess: boolean;
  }) => {
    if (!restaurantId) return;
    useOutboxStore.getState().enqueue({
      id: input.id,
      restaurantId,
      event: input.event,
      payload: input.payload as Record<string, unknown>,
      orderId: input.order.id,
      orderLabel: orderLabel(input.order),
      summary: input.summary,
      printOnSuccess: input.printOnSuccess,
    });
  };

  const buildDetail = (
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
      },
      useAuthStore.getState().user,
    );
  };

  const productNotAvailable = (onError?: QueueOptions<unknown>["onError"]) =>
    onError?.({ ok: false, msg: t("orders:offline.productNotAvailable") });

  const createOrder = async (
    dto: CreateOrderDto,
    options: QueueOptions<Order> = {},
  ) => {
    const operationId = dto.idempotencyKey ?? generateIdempotencyKey();
    const orderId = generateIdempotencyKey();
    const detailIds = dto.details.map(() => generateIdempotencyKey());

    const details = dto.details.map((item, i) =>
      buildDetail(item, detailIds[i]),
    );
    if (details.some((detail) => !detail)) {
      productNotAvailable(options.onError);
      return;
    }

    const order = buildLocalOrder({
      id: orderId,
      type: dto.typeOrder,
      people: dto.people,
      table: useTablesStore
        .getState()
        .tables.find((table) => table.id === dto.tableId),
      notes: dto.notes,
      deliveryTime: dto.deliveryTime ? new Date(dto.deliveryTime) : undefined,
      details: details as OrderDetail[],
      user: useAuthStore.getState().user,
    });

    saveOrder(order);

    const ticketPrinted = options.print
      ? await printLocally(order, buildLocalNewTicket(order))
      : undefined;

    enqueue({
      id: operationId,
      event: OrderSocketEvent.createOrder,
      payload: {
        ...dto,
        idempotencyKey: operationId,
        id: orderId,
        details: dto.details.map((item, i) => ({ ...item, id: detailIds[i] })),
        clientCreatedAt: order.createdAt.toISOString(),
        ...(ticketPrinted !== undefined && { ticketPrinted }),
      },
      order,
      summary: t("orders:offline.summary.createOrder", {
        count: dto.details.length,
      }),
      printOnSuccess: !!options.print && ticketPrinted === undefined,
    });

    options.onSuccess?.({ ok: true, msg: "", data: order });
  };

  const addOrderDetails = async (
    dto: AddOrderDetailsDto,
    options: QueueOptions<UpdateOrderResp> = {},
  ) => {
    const order = findOrder(dto.orderId);
    if (!order) return;

    const operationId = generateIdempotencyKey();
    const detailIds = dto.newDetails.map(() => generateIdempotencyKey());
    const details = dto.newDetails.map((item, i) =>
      buildDetail(item, detailIds[i]),
    );
    if (details.some((detail) => !detail)) {
      productNotAvailable(options.onError);
      return;
    }

    const updated = addLocalDetails(order, details as OrderDetail[]);
    saveOrder(updated);

    const ticketPrinted = await printLocally(
      updated,
      buildLocalAddTicket(updated, details as OrderDetail[]),
    );

    enqueue({
      id: operationId,
      event: OrderSocketEvent.addOrderDetails,
      payload: {
        ...dto,
        operationId,
        newDetails: dto.newDetails.map((item, i) => ({
          ...item,
          id: detailIds[i],
        })),
        ...(ticketPrinted !== undefined && { ticketPrinted }),
      },
      order: updated,
      summary: t("orders:offline.summary.addItems", {
        count: dto.newDetails.length,
      }),
      printOnSuccess: ticketPrinted === undefined,
    });

    options.onSuccess?.({ ok: true, msg: "", data: { order: updated } });
  };

  const addOrderDetail = async (
    dto: AddOrderDetailToOrderDto,
    options: QueueOptions<UpdateOrderResp> = {},
  ) => {
    const order = findOrder(dto.orderId);
    if (!order) return;

    const operationId = generateIdempotencyKey();
    const detailId = generateIdempotencyKey();
    const detail = buildDetail(dto, detailId);
    if (!detail) {
      productNotAvailable(options.onError);
      return;
    }

    const updated = addLocalDetails(order, [detail]);
    saveOrder(updated);
    useOrdersStore.getState().setActiveOrder(updated);

    const ticketPrinted = await printLocally(
      updated,
      buildLocalAddTicket(updated, [detail]),
    );

    enqueue({
      id: operationId,
      event: OrderSocketEvent.addOrderDetail,
      payload: {
        ...dto,
        id: detailId,
        operationId,
        ...(ticketPrinted !== undefined && { ticketPrinted }),
      },
      order: updated,
      summary: t("orders:offline.summary.addItems", { count: 1 }),
      printOnSuccess: ticketPrinted === undefined,
    });

    options.onSuccess?.({ ok: true, msg: "", data: { order: updated } });
  };

  const updateOrderDetail = async (
    dto: UpdateOrderDetailDto,
    options: QueueOptions<UpdateOrderResp> = {},
  ) => {
    const order = findOrder(dto.orderId);
    const before = order?.details.find((detail) => detail.id === dto.id);
    if (!order || !before) return;

    const operationId = generateIdempotencyKey();
    const updated = applyLocalDetailUpdate(order, dto);
    const after = updated.details.find((detail) => detail.id === dto.id)!;
    saveOrder(updated);
    useOrdersStore.getState().setActiveOrder(updated);

    const ticketPrinted = await printLocally(
      updated,
      buildLocalUpdateTicket(updated, before, after),
    );

    enqueue({
      id: operationId,
      event: OrderSocketEvent.updateOrderDetail,
      payload: {
        ...dto,
        operationId,
        ...(ticketPrinted !== undefined && { ticketPrinted }),
      },
      order: updated,
      summary: t("orders:offline.summary.updateItem", {
        product: before.product?.name ?? "",
      }),
      printOnSuccess: ticketPrinted === undefined,
    });

    options.onSuccess?.({ ok: true, msg: "", data: { order: updated } });
  };

  const updateOrderDetails = (
    dto: UpdateOrderDetailsDto,
    options: QueueOptions<Order> = {},
  ) => {
    const order = findOrder(dto.orderId);
    if (!order) return;

    const operationId = generateIdempotencyKey();
    const updated = dto.details.reduce(
      (acc, detail) => applyLocalDetailUpdate(acc, detail),
      order,
    );
    saveOrder(updated);

    enqueue({
      id: operationId,
      event: OrderSocketEvent.updateOrderDetails,
      payload: { ...dto, operationId },
      order: updated,
      summary: t("orders:offline.summary.updateItems", {
        count: dto.details.length,
      }),
      printOnSuccess: false,
    });

    options.onSuccess?.({ ok: true, msg: "", data: updated });
  };

  const removeOrderDetail = async (
    dto: DeleteOrderDetailDto,
    options: QueueOptions<UpdateOrderResp> = {},
  ) => {
    const order = findOrder(dto.orderId);
    const detail = order?.details.find((d) => d.id === dto.detailId);
    if (!order || !detail) return;

    const operationId = generateIdempotencyKey();
    const updated = applyLocalDetailRemoval(order, dto.detailId);
    saveOrder(updated);

    const ticketPrinted = await printLocally(
      updated,
      buildLocalCancelTicket(updated, detail),
    );

    enqueue({
      id: operationId,
      event: OrderSocketEvent.deleteOrderDetail,
      payload: {
        ...dto,
        operationId,
        ...(ticketPrinted !== undefined && { ticketPrinted }),
      },
      order: updated,
      summary: t("orders:offline.summary.removeItem", {
        product: detail.product?.name ?? "",
      }),
      printOnSuccess: ticketPrinted === undefined,
    });

    options.onSuccess?.({ ok: true, msg: "", data: { order: updated } });
  };

  const updateOrder = (dto: UpdateOrderDto, options: QueueOptions<Order> = {}) => {
    const order = findOrder(dto.id);
    if (!order) return;

    const operationId = generateIdempotencyKey();
    const updated = applyLocalOrderUpdate(
      order,
      dto,
      useTablesStore.getState().tables,
    );
    saveOrder(updated);
    useOrdersStore.getState().setActiveOrder(updated);

    enqueue({
      id: operationId,
      event: OrderSocketEvent.updateOrder,
      payload: { ...dto, operationId },
      order: updated,
      summary: t("orders:offline.summary.updateOrder"),
      printOnSuccess: false,
    });

    options.onSuccess?.({ ok: true, msg: "", data: updated });
  };

  return {
    shouldQueue,
    createOrder,
    addOrderDetails,
    addOrderDetail,
    updateOrderDetail,
    updateOrderDetails,
    removeOrderDetail,
    updateOrder,
  };
};
