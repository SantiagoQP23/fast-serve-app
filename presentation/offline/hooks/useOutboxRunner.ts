import { useCallback, useContext, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { toast } from "sonner-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { Socket } from "socket.io-client";
import { SocketContext } from "@/presentation/shared/context/SocketContext";
import { useAppForeground } from "@/presentation/shared/hooks/useAppForeground";
import { SocketResponseData } from "@/core/common/dto/socket.dto";
import { translateSocketResponse } from "@/core/api/get-error-message";
import { Order } from "@/core/orders/models/order.model";
import { Ticket } from "@/core/tickets/models/ticket.model";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { usePrintComanda } from "@/presentation/orders/hooks/usePrintComanda";
import { syncQueryKey } from "@/presentation/sync/hooks/useSync";
import { OutboxOperation, useOutboxStore } from "../store/useOutboxStore";
import { fromServerOrder, refreshOrderView, showOrder } from "../rebase";
import { claimForAnswer, markTicketsPrinted } from "../slow-comanda";

const SEND_TIMEOUT_MS = 15000;
const RETRY_DELAYS_MS = [5000, 15000, 30000, 60000];

/** The server already has this change (e.g. the first send's ack was lost). */
const ALREADY_APPLIED_CODES = [
  "ORDER_ALREADY_EXISTS",
  "ORDER_DETAIL_ALREADY_EXISTS",
];
/** The order isn't open on the server anymore. */
const ORDER_GONE_CODES = ["ORDER_CLOSED", "ORDER_NOT_FOUND"];
/** The server is still processing the same operation; ask again later. */
const IN_PROGRESS_CODE = "ORDER_OPERATION_IN_PROGRESS";

type SendResult = "sent" | "failed" | "retry";

const orderFromResponse = (
  data: unknown,
): { order?: Order; tickets: Ticket[] } => {
  if (!data || typeof data !== "object") return { tickets: [] };

  if ("order" in data) {
    const { order, ticket } = data as { order?: Order; ticket?: Ticket };
    return { order, tickets: ticket ? [ticket] : [] };
  }

  const order = data as Order;
  return order.id ? { order, tickets: order.tickets ?? [] } : { tickets: [] };
};

/**
 * Sends the outbox (every order action, online or offline) to the server,
 * one at a time and in order, whenever the socket is connected. Mounted
 * once, in the tabs layout. Each action carries its own operationId, so a
 * resend after a lost ack is applied once.
 *
 * - Sent: removed from the outbox; the server's order becomes the base and
 *   any actions still queued for it are replayed on top.
 * - Rejected by the server (order closed, item gone, ...): marked failed,
 *   taken back on screen, and a toast says so with "Reintentar" and "Ver".
 *   Later actions on the same order wait behind it; other orders keep going.
 * - No answer: kept pending and retried with backoff or on reconnect.
 *
 * Once nothing is left to send, the app syncs to pick up what others changed
 * and to replace every local copy with the server's.
 */
export const useOutboxRunner = () => {
  const { socket, online } = useContext(SocketContext);
  const restaurantId = useAuthStore((state) => state.currentRestaurant?.id);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t } = useTranslation(["orders"]);
  const { printComanda } = usePrintComanda();

  const runningRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptRef = useRef(0);

  const pendingCount = useOutboxStore(
    (state) =>
      state.operations.filter(
        (op) => op.restaurantId === restaurantId && op.status === "pending",
      ).length,
  );

  const applyServerOrder = useCallback((op: OutboxOperation, order?: Order) => {
    if (!order?.id) return;

    // The server answered a create with an order it already had under
    // another id (same idempotencyKey sent twice): this local copy is a
    // duplicate. Drop it and move anything queued for it to the real order.
    if (order.id !== op.orderId) {
      useOutboxStore.getState().remapOrder(op.orderId, order.id);
      const store = useOrdersStore.getState();
      store.deleteOrder(op.orderId);
      if (store.activeOrder?.id === op.orderId) store.setActiveOrder(order);
    }

    // Actions still queued for it are replayed on top of the server's.
    showOrder(fromServerOrder(order));
  }, []);

  const send = useCallback(
    async (activeSocket: Socket, op: OutboxOperation): Promise<SendResult> => {
      const outbox = useOutboxStore.getState();
      outbox.setStatus(op.id, "sending");

      let resp: SocketResponseData<unknown> & { code?: string };
      try {
        resp = await activeSocket
          .timeout(SEND_TIMEOUT_MS)
          .emitWithAck(op.event, op.payload);
      } catch {
        // Timed out or disconnected: the server may or may not have it.
        // Resending with the same operationId is safe either way.
        outbox.setStatus(op.id, "pending");
        return "retry";
      }

      if (resp?.code === IN_PROGRESS_CODE) {
        outbox.setStatus(op.id, "pending");
        return "retry";
      }

      if (
        resp?.ok ||
        (resp?.code && ALREADY_APPLIED_CODES.includes(resp.code))
      ) {
        outbox.remove(op.id);

        const { order, tickets } = orderFromResponse(resp.data);
        applyServerOrder(op, order);

        if (order && tickets.length) {
          // The phone may have printed its own comanda while waiting.
          const printer = op.printOnSuccess
            ? await claimForAnswer(op.id)
            : op.markTicketsPrinted
              ? "printed"
              : null;
          if (printer === "print") {
            for (const ticket of tickets) {
              await printComanda(order, ticket);
            }
          } else if (printer === "printed") {
            await markTicketsPrinted(order.id, tickets);
          }
        }
        return "sent";
      }

      const error = {
        code: resp?.code,
        msg: resp ? translateSocketResponse(resp).msg : "",
      };
      outbox.setStatus(op.id, "failed", error);
      // Take the change back on screen and say so; nothing else shows errors.
      if (
        error.code &&
        ORDER_GONE_CODES.includes(error.code) &&
        !isCreateOrderOperation(op)
      ) {
        // Closed or deleted on the server meanwhile: it leaves the screen
        // like any closed order; the change waits on "Cambios sin
        // sincronizar" to be retried or discarded.
        useOutboxStore.getState().dropBase(op.orderId);
        const store = useOrdersStore.getState();
        store.deleteOrder(op.orderId);
        if (store.activeOrder?.id === op.orderId) store.setActiveOrder(null);
      } else {
        refreshOrderView(op.orderId);
      }
      showRejection(op, error.msg);
      return "failed";
    },
    [applyServerOrder, printComanda],
  );

  const showRejection = (op: OutboxOperation, msg: string) => {
    toast.error(
      t("orders:offline.rejectedToast", {
        summary: op.summary,
        order: op.orderLabel,
      }),
      {
        id: `outbox-${op.id}`,
        description: msg || t("orders:offline.rejected"),
        duration: 8000,
        action: {
          label: t("orders:offline.retry"),
          onClick: () => {
            toast.dismiss(`outbox-${op.id}`);
            retryOperationRef.current?.(op.id);
          },
        },
        cancel: {
          label: t("orders:offline.view"),
          onClick: () => {
            toast.dismiss(`outbox-${op.id}`);
            router.push("/(order)/pending-changes");
          },
        },
      },
    );
  };

  const retryOperationRef = useRef<((id: string) => void) | null>(null);

  const drain = useCallback(async () => {
    if (runningRef.current || !socket?.connected || !restaurantId) return;
    runningRef.current = true;

    let result: SendResult | null = null;
    let sentAny = false;

    try {
      while (socket.connected) {
        const ops = useOutboxStore
          .getState()
          .operations.filter((op) => op.restaurantId === restaurantId);
        const blockedOrders = new Set(
          ops.filter((op) => op.status === "failed").map((op) => op.orderId),
        );
        const next = ops.find(
          (op) => op.status === "pending" && !blockedOrders.has(op.orderId),
        );
        if (!next) break;

        result = await send(socket, next);
        if (result === "sent") sentAny = true;
        if (result === "retry") break;
      }
    } finally {
      runningRef.current = false;
    }

    if (result === "retry") {
      const delay =
        RETRY_DELAYS_MS[
          Math.min(retryAttemptRef.current, RETRY_DELAYS_MS.length - 1)
        ];
      retryAttemptRef.current += 1;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => void drain(), delay);
      return;
    }

    retryAttemptRef.current = 0;

    const stillPending = useOutboxStore
      .getState()
      .operations.some(
        (op) => op.restaurantId === restaurantId && op.status === "pending",
      );
    if (sentAny && !stillPending) {
      void queryClient.refetchQueries({
        queryKey: syncQueryKey(restaurantId),
        exact: true,
      });
    }
  }, [socket, restaurantId, send, queryClient]);

  retryOperationRef.current = (id: string) => {
    const op = useOutboxStore.getState().operations.find((o) => o.id === id);
    if (!op) return;
    useOutboxStore.getState().setStatus(id, "pending");
    refreshOrderView(op.orderId);
  };

  // New actions queued, connection back, or restaurant changed.
  useEffect(() => {
    if (online && pendingCount > 0) void drain();
  }, [online, pendingCount, drain]);

  useAppForeground(() => {
    void drain();
  });

  useEffect(
    () => () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    },
    [],
  );

  return { drain };
};

/** Events whose rejection leaves an order that only exists on this phone. */
export const isCreateOrderOperation = (op: OutboxOperation) =>
  op.event === OrderSocketEvent.createOrder;
