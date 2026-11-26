import { useContext } from "react";
import { SocketContext } from "@/presentation/shared/context/SocketContext";
import { SocketResponseData } from "@/core/common/dto/socket.dto";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { generateIdempotencyKey } from "@/helpers/idempotency";
import { Order } from "@/core/orders/models/order.model";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";
import { Ticket } from "@/core/tickets/models/ticket.model";
import { CreateOrderDto } from "@/core/orders/dto/create-order.dto";
import {
  AddOrderDetailToOrderDto,
  AddOrderDetailsDto,
  DeleteOrderDetailDto,
  UpdateOrderDetailDto,
  UpdateOrderDetailsDto,
  UpdateOrderDto,
  UpdateOrderResp,
} from "@/core/orders/dto/update-order.dto";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { usePrintComanda } from "@/presentation/orders/hooks/usePrintComanda";
import { OutboxEvent, useOutboxStore } from "../store/useOutboxStore";
import { buildQueuedDetail, rememberBase } from "../rebase";
import { printComandaIfServerIsSlow } from "../slow-comanda";
import { finishCreatingOrder, startCreatingOrder } from "../pending-orders";
import {
  addLocalDetails,
  applyLocalDetailRemoval,
  applyLocalDetailUpdate,
  applyLocalOrderUpdate,
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

/** Actions that can take stock, and so accept `queuedOffline`. */
const STOCK_CHECKED_EVENTS: OutboxEvent[] = [
  OrderSocketEvent.createOrder,
  OrderSocketEvent.addOrderDetail,
  OrderSocketEvent.addOrderDetails,
  OrderSocketEvent.updateOrderDetail,
  OrderSocketEvent.updateOrderDetails,
];

/**
 * Order actions are optimistic, online and offline: applied to the local
 * order right away, the comanda printed from the phone, and queued in the
 * outbox so useOutboxRunner sends them in order in the background. Only a
 * rejection from the server shows an error (and takes the change back).
 */
export const useOrderOutbox = () => {
  const { socket } = useContext(SocketContext);
  const { t } = useTranslation(["orders"]);
  const { printComanda } = usePrintComanda();

  const restaurantId = useAuthStore((state) => state.currentRestaurant?.id);

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
   * The comanda of an action. Offline, the one built on the phone prints
   * right away and the result goes in the payload as `ticketPrinted`.
   * Online, the server's prints when it answers (so the kitchen never gets
   * a comanda the server rejected), and the phone's only if the answer
   * takes too long. Returns `ticketPrinted`, or undefined when the answer
   * should print it.
   */
  const printComandaFor = async (
    operationId: string,
    order: Order,
    ticket: Ticket | null,
  ): Promise<boolean | undefined> => {
    if (!ticket) return undefined;
    if (!socket?.connected) {
      return printComanda(order, ticket, { markPrinted: false });
    }
    printComandaIfServerIsSlow(operationId, order, ticket, printComanda);
    return undefined;
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
      // Taken without a connection: the server accepts it even when the
      // restaurant blocks products without stock, since the waiter already
      // took it (and the comanda may be printed).
      payload: {
        ...input.payload,
        ...(!socket?.connected &&
          STOCK_CHECKED_EVENTS.includes(input.event) && {
            queuedOffline: true,
          }),
      } as Record<string, unknown>,
      orderId: input.order.id,
      orderLabel: orderLabel(input.order),
      summary: input.summary,
      printOnSuccess: input.printOnSuccess,
    });
  };

  const buildDetail = buildQueuedDetail;

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

    // Same cart sent again (double tap, or a tap while the comanda prints):
    // the first one is already creating this order.
    if (!startCreatingOrder(operationId, orderId)) return;
    try {
      await queueNewOrder(dto, options, {
        operationId,
        orderId,
        detailIds,
        details,
      });
    } finally {
      finishCreatingOrder(operationId);
    }
  };

  const queueNewOrder = async (
    dto: CreateOrderDto,
    options: QueueOptions<Order>,
    {
      operationId,
      orderId,
      detailIds,
      details,
    }: {
      operationId: string;
      orderId: string;
      detailIds: string[];
      details: (OrderDetail | null)[];
    },
  ) => {
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

    // Online it waits for the server's answer, so it carries the order's
    // number; offline it prints without one.
    const ticketPrinted = options.print
      ? await printComandaFor(operationId, order, buildLocalNewTicket(order))
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
    rememberBase(order);

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

    const ticketPrinted = await printComandaFor(
      operationId,
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
    rememberBase(order);

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

    const ticketPrinted = await printComandaFor(
      operationId,
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
    rememberBase(order);

    const operationId = generateIdempotencyKey();
    const updated = applyLocalDetailUpdate(order, dto);
    const after = updated.details.find((detail) => detail.id === dto.id)!;
    saveOrder(updated);
    useOrdersStore.getState().setActiveOrder(updated);

    const ticketPrinted = await printComandaFor(
      operationId,
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
    rememberBase(order);

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
    rememberBase(order);

    const operationId = generateIdempotencyKey();
    const updated = applyLocalDetailRemoval(order, dto.detailId);
    saveOrder(updated);

    const ticketPrinted = await printComandaFor(
      operationId,
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

  const updateOrder = (
    dto: UpdateOrderDto,
    options: QueueOptions<Order> = {},
  ) => {
    const order = findOrder(dto.id);
    if (!order) return;
    rememberBase(order);

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
    createOrder,
    addOrderDetails,
    addOrderDetail,
    updateOrderDetail,
    updateOrderDetails,
    removeOrderDetail,
    updateOrder,
  };
};
