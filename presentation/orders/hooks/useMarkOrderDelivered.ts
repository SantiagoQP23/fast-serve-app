import { useRef } from "react";
import { toast } from "sonner-native";
import { Order } from "@/core/orders/models/order.model";
import { OrderDetailStatus } from "@/core/orders/models/order-detail.model";
import { useOrders } from "./useOrders";
import { useOrdersStore } from "../store/useOrdersStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

type DetailState = { status: OrderDetailStatus; qtyDelivered: number };

const buildOrderWithDetailStates = (
  sourceOrder: Order,
  statesByDetailId: Map<string, DetailState>,
): Order => ({
  ...sourceOrder,
  details: sourceOrder.details.map((detail) => {
    const state = statesByDetailId.get(detail.id);
    return state
      ? { ...detail, status: state.status, qtyDelivered: state.qtyDelivered }
      : detail;
  }),
});

export const useMarkOrderDelivered = () => {
  const { t } = useTranslation(["common", "orders"]);
  const { mutate: updateOrderDetails } = useOrders().updateOrderDetails;
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const updateOrderInStore = useOrdersStore((state) => state.updateOrder);
  const activeOrder = useOrdersStore((state) => state.activeOrder);

  const actionIdRef = useRef(0);
  const pendingUndoRef = useRef<{
    toastId: string | number;
    actionId: number;
    orderId: string;
    timeoutId: ReturnType<typeof setTimeout>;
    previousStates: Map<string, DetailState>;
    undone: boolean;
  } | null>(null);

  const dismissPendingUndo = () => {
    if (pendingUndoRef.current) {
      toast.dismiss(pendingUndoRef.current.toastId);
      clearTimeout(pendingUndoRef.current.timeoutId);
      pendingUndoRef.current = null;
    }
  };

  const sendRevertToBackend = (
    orderId: string,
    previousStates: Map<string, DetailState>,
  ) => {
    const details: {
      id: string;
      status: OrderDetailStatus;
      qtyDelivered: number;
    }[] = [];
    previousStates.forEach((state, id) => {
      details.push({
        id,
        status: state.status,
        qtyDelivered: state.qtyDelivered,
      });
    });

    if (details.length === 0) return;

    updateOrderDetails(
      { orderId, details },
      {
        showLoader: false,
        onSuccess: () => {},
        onError: (resp) => {
          toast.error(resp.msg || t("orders:options.undoDeliveredError"));
        },
      },
    );
  };

  const handleMarkDeliveredError = (
    order: Order,
    actionId: number,
    previousStates: Map<string, DetailState>,
    errorMsg?: string,
  ) => {
    if (pendingUndoRef.current?.actionId !== actionId) return;

    const revertedOrder = buildOrderWithDetailStates(order, previousStates);
    updateOrderInStore(revertedOrder);
    if (activeOrder?.id === order.id) setActiveOrder(revertedOrder);

    dismissPendingUndo();
    toast.error(errorMsg || t("orders:options.markDeliveredError"));
  };

  const handleUndo = (
    order: Order,
    toastId: string | number,
    previousStates: Map<string, DetailState>,
  ) => {
    if (pendingUndoRef.current?.toastId !== toastId) return;

    pendingUndoRef.current.undone = true;

    const revertedOrder = buildOrderWithDetailStates(order, previousStates);
    updateOrderInStore(revertedOrder);
    if (activeOrder?.id === order.id) setActiveOrder(revertedOrder);

    dismissPendingUndo();
    sendRevertToBackend(order.id, previousStates);
  };

  const markDelivered = (
    order: Order,
    detailsToDeliver = order.details.filter(
      (detail) =>
        detail.status !== OrderDetailStatus.DELIVERED &&
        detail.status !== OrderDetailStatus.CANCELLED,
    ),
  ) => {
    if (detailsToDeliver.length === 0) return;

    const previousStates = new Map(
      detailsToDeliver.map((detail) => [
        detail.id,
        { status: detail.status, qtyDelivered: detail.qtyDelivered },
      ]),
    );
    const deliveredStates = new Map(
      detailsToDeliver.map((detail) => [
        detail.id,
        { status: OrderDetailStatus.DELIVERED, qtyDelivered: detail.quantity },
      ]),
    );

    const optimisticOrder = buildOrderWithDetailStates(order, deliveredStates);
    updateOrderInStore(optimisticOrder);
    if (activeOrder?.id === order.id) setActiveOrder(optimisticOrder);

    dismissPendingUndo();

    const actionId = ++actionIdRef.current;
    const count = detailsToDeliver.length;
    const message =
      count === 1
        ? t("orders:options.itemMarkedDelivered", { count })
        : t("orders:options.itemsMarkedDelivered", { count });

    const toastId = toast(message, {
      duration: 5000,
      action: {
        label: t("common:actions.undo"),
        onClick: () => handleUndo(order, toastId, previousStates),
      },
    });

    const timeoutId = setTimeout(() => {
      if (pendingUndoRef.current?.toastId === toastId) {
        pendingUndoRef.current = null;
      }
    }, 5000);

    pendingUndoRef.current = {
      toastId,
      actionId,
      orderId: order.id,
      timeoutId,
      previousStates,
      undone: false,
    };

    updateOrderDetails(
      {
        orderId: order.id,
        details: detailsToDeliver.map((detail) => ({
          id: detail.id,
          status: OrderDetailStatus.DELIVERED,
          qtyDelivered: detail.quantity,
        })),
      },
      {
        showLoader: false,
        onSuccess: () => {
          if (pendingUndoRef.current?.actionId !== actionId) return;
          if (pendingUndoRef.current.undone) return;
          // Keep the optimistic changes; the snackbar remains active until it expires.
        },
        onError: (resp) => {
          handleMarkDeliveredError(order, actionId, previousStates, resp.msg);
        },
      },
    );
  };

  return { markDelivered };
};
