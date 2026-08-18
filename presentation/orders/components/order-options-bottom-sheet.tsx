import { BottomSheetView } from "@gorhom/bottom-sheet";
import { Alert, Pressable } from "react-native";
import { useRef } from "react";
import { toast } from "sonner-native";
import { Order } from "@/core/orders/models/order.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { OrderDetailStatus } from "@/core/orders/models/order-detail.model";
import { useOrders } from "../hooks/useOrders";
import { useRouter } from "expo-router";
import { useOrdersStore } from "../store/useOrdersStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { i18nAlert } from "@/core/i18n/utils";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

interface OrderOptionsBottomSheetProps {
  order: Order;
  onClose?: () => void;
  onReassign?: () => void;
}

interface OptionItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  onPress: () => void;
  disabled?: boolean;
  divider?: boolean;
  visible?: boolean;
}

const OrderOptionsBottomSheet = ({
  order,
  onClose,
  onReassign,
}: OrderOptionsBottomSheetProps) => {
  const { t } = useTranslation(["common", "orders", "bills"]);
  const { mutate: updateOrder } = useOrders().updateOrder;
  const { mutate: updateOrderDetails } = useOrders().updateOrderDetails;
  const { mutate: deleteOrder } = useOrders().deleteOrder;
  const router = useRouter();
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const updateOrderInStore = useOrdersStore((state) => state.updateOrder);
  const activeOrder = useOrdersStore((state) => state.activeOrder);
  const { user } = useAuthStore();
  const isAdmin = user?.role?.name === "admin";

  const actionIdRef = useRef(0);
  const pendingUndoRef = useRef<{
    toastId: string | number;
    actionId: number;
    timeoutId: ReturnType<typeof setTimeout>;
    previousStates: Map<
      string,
      { status: OrderDetailStatus; qtyDelivered: number }
    >;
    undone: boolean;
  } | null>(null);

  const buildOrderWithDetailStates = (
    sourceOrder: Order,
    statesByDetailId: Map<
      string,
      { status: OrderDetailStatus; qtyDelivered: number }
    >,
  ): Order => ({
    ...sourceOrder,
    details: sourceOrder.details.map((detail) => {
      const state = statesByDetailId.get(detail.id);
      return state
        ? { ...detail, status: state.status, qtyDelivered: state.qtyDelivered }
        : detail;
    }),
  });

  const dismissPendingUndo = () => {
    if (pendingUndoRef.current) {
      toast.dismiss(pendingUndoRef.current.toastId);
      clearTimeout(pendingUndoRef.current.timeoutId);
      pendingUndoRef.current = null;
    }
  };

  const handleCloseOrder = () => {
    Alert.alert(
      t("orders:dialogs.closeTitle"),
      t("orders:dialogs.closeMessage"),
      [
        { text: t("common:actions.cancel"), style: "cancel" },
        {
          text: t("common:actions.close"),
          style: "destructive",
          onPress: () => {
            updateOrder(
              { id: order.id, isClosed: true },
              {
                onSuccess: () => {
                  onClose?.();
                  router.back();
                },
              },
            );
          },
        },
      ],
    );
  };

  const handleDeleteOrder = () => {
    const orderCantBeDeleted =
      order.status !== OrderStatus.PENDING ||
      order.details.some((detail) => detail.qtyDelivered !== 0);

    if (orderCantBeDeleted) {
      i18nAlert(
        t("orders:deleteAlerts.cannotDelete"),
        t("orders:deleteAlerts.cannotDeleteMessage"),
      );
      return;
    }

    Alert.alert(
      t("orders:deleteAlerts.confirmDelete"),
      t("orders:deleteAlerts.confirmDeleteMessage"),
      [
        { text: t("common:actions.cancel"), style: "cancel" },
        {
          text: t("common:actions.delete"),
          style: "destructive",
          onPress: () => {
            deleteOrder(order.id, {
              onSuccess: () => {
                onClose?.();
                setActiveOrder(null);
                router.back();
              },
            });
          },
        },
      ],
    );
  };

  const handleMarkDeliveredError = (
    actionId: number,
    previousStates: Map<
      string,
      { status: OrderDetailStatus; qtyDelivered: number }
    >,
    errorMsg?: string,
  ) => {
    if (pendingUndoRef.current?.actionId !== actionId) return;

    const revertedOrder = buildOrderWithDetailStates(order, previousStates);
    updateOrderInStore(revertedOrder);
    if (activeOrder?.id === order.id) setActiveOrder(revertedOrder);

    dismissPendingUndo();
    Alert.alert(
      t("common:actions.error"),
      errorMsg || t("orders:options.markDeliveredError"),
    );
  };

  const sendRevertToBackend = (
    previousStates: Map<
      string,
      { status: OrderDetailStatus; qtyDelivered: number }
    >,
  ) => {
    const details: { id: string; status: OrderDetailStatus; qtyDelivered: number }[] =
      [];
    previousStates.forEach((state, id) => {
      details.push({ id, status: state.status, qtyDelivered: state.qtyDelivered });
    });

    if (details.length === 0) return;

    updateOrderDetails(
      { orderId: order.id, details },
      {
        onSuccess: () => {},
        onError: (resp) => {
          toast.error(resp.msg || t("orders:options.undoDeliveredError"));
        },
      },
    );
  };

  const handleUndo = (
    toastId: string | number,
    previousStates: Map<
      string,
      { status: OrderDetailStatus; qtyDelivered: number }
    >,
  ) => {
    if (pendingUndoRef.current?.toastId !== toastId) return;

    pendingUndoRef.current.undone = true;

    const revertedOrder = buildOrderWithDetailStates(order, previousStates);
    updateOrderInStore(revertedOrder);
    if (activeOrder?.id === order.id) setActiveOrder(revertedOrder);

    dismissPendingUndo();
    sendRevertToBackend(previousStates);
  };

  const handleMarkDelivered = () => {
    const deliverableDetails = order.details.filter(
      (detail) =>
        detail.status !== OrderDetailStatus.DELIVERED &&
        detail.status !== OrderDetailStatus.CANCELLED,
    );

    if (deliverableDetails.length === 0) return;

    onClose?.();

    const previousStates = new Map(
      deliverableDetails.map((detail) => [
        detail.id,
        { status: detail.status, qtyDelivered: detail.qtyDelivered },
      ]),
    );
    const deliveredStates = new Map(
      deliverableDetails.map((detail) => [
        detail.id,
        { status: OrderDetailStatus.DELIVERED, qtyDelivered: detail.quantity },
      ]),
    );

    const optimisticOrder = buildOrderWithDetailStates(order, deliveredStates);
    updateOrderInStore(optimisticOrder);
    if (activeOrder?.id === order.id) setActiveOrder(optimisticOrder);

    dismissPendingUndo();

    const actionId = ++actionIdRef.current;
    const count = deliverableDetails.length;
    const message =
      count === 1
        ? t("orders:options.itemMarkedDelivered", { count })
        : t("orders:options.itemsMarkedDelivered", { count });

    const toastId = toast(message, {
      duration: 5000,
      action: {
        label: t("common:actions.undo"),
        onClick: () => handleUndo(toastId, previousStates),
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
      timeoutId,
      previousStates,
      undone: false,
    };

    updateOrderDetails(
      {
        orderId: order.id,
        details: deliverableDetails.map((detail) => ({
          id: detail.id,
          status: OrderDetailStatus.DELIVERED,
          qtyDelivered: detail.quantity,
        })),
      },
      {
        onSuccess: () => {
          if (pendingUndoRef.current?.actionId !== actionId) return;
          if (pendingUndoRef.current.undone) return;
          // Keep the optimistic changes; the snackbar remains active until it expires.
        },
        onError: (resp) => {
          handleMarkDeliveredError(actionId, previousStates, resp.msg);
        },
      },
    );
  };

  const handleNavigateToPayments = () => {
    onClose?.();
    router.push(`/(order)/${order.id}/bills`);
  };

  const handleNavigateToAddProduct = () => {
    onClose?.();
    router.push("/restaurant-menu");
  };

  const orderCantBeDeleted =
    order.status !== OrderStatus.PENDING ||
    order.details.some((detail) => detail.qtyDelivered !== 0);

  const canCloseOrder = order.status === OrderStatus.DELIVERED && order.isPaid;
  const canForceCloseOrder =
    isAdmin && order.status === OrderStatus.DELIVERED && !order.isPaid;

  const options: OptionItem[] = [
    {
      icon: "person-outline",
      label: t("orders:options.reassignOrder"),
      onPress: () => {
        onClose?.();
        onReassign?.();
      },
      divider: true,
    },
    {
      icon: "checkmark-done-outline",
      label: t("orders:options.markDelivered"),
      onPress: handleMarkDelivered,
      disabled: order.details.every(
        (detail) => detail.status === OrderDetailStatus.DELIVERED,
      ),
      divider: true,
    },
    {
      icon: "lock-closed-outline",
      label: t("orders:options.forceCloseOrder"),
      onPress: handleCloseOrder,
      disabled: !canForceCloseOrder,
      visible: isAdmin,
      divider: true,
    },
    {
      icon: "trash-outline",
      label: t("orders:options.deleteOrder"),
      color: "text-red-500",
      onPress: handleDeleteOrder,
      disabled: orderCantBeDeleted,
    },
  ];

  const visibleOptions = options.filter((opt) => opt.visible !== false);

  return (
    <BottomSheetView style={tw`px-4 pb-6`}>
      <ThemedView style={tw`mb-4`}>
        <ThemedText type="h3">{t("orders:options.title")}</ThemedText>
        <ThemedText type="body2" style={tw`text-gray-500 mt-1`}>
          {t("orders:details.orderNumber", { num: order.num })}
        </ThemedText>
      </ThemedView>

      <ThemedView style={tw`gap-2`}>
        {visibleOptions.map((option, index) => (
          <ThemedView key={index}>
            <Pressable
              onPress={option.onPress}
              disabled={option.disabled}
              style={({ pressed }) => [
                tw.style(
                  "flex-row items-center gap-3 p-3 rounded-xl",
                  pressed && !option.disabled && "bg-gray-100",
                  option.disabled && "opacity-40",
                ),
              ]}
            >
              <Ionicons
                name={option.icon}
                size={22}
                color={
                  option.disabled
                    ? tw.color("light-primary")
                    : option.color
                      ? tw.color(option.color.replace("text-", ""))
                      : tw.color("light-primary")
                }
              />
              <ThemedText
                type="body1"
                style={tw.style(
                  "flex-1",
                  option.color && !option.disabled && option.color,
                )}
              >
                {option.label}
              </ThemedText>
              {!option.disabled && (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={tw.color("gray-400")}
                />
              )}
            </Pressable>
            {option.divider && <ThemedView style={tw`h-px bg-gray-200 my-2`} />}
          </ThemedView>
        ))}
      </ThemedView>
    </BottomSheetView>
  );
};

export default OrderOptionsBottomSheet;
