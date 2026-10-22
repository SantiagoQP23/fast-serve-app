import { useMemo } from "react";
import { toast } from "sonner-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { CloseOrdersDto } from "@/core/orders/dto/update-order.dto";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useOrdersStore } from "../store/useOrdersStore";
import { useOrders } from "./useOrders";

/**
 * Open orders that are paid and delivered (everyone's and the user's own),
 * and the action that closes them on the server.
 */
export const useClosePaidOrders = () => {
  const { t } = useTranslation(["orders"]);
  const orders = useOrdersStore((state) => state.orders);
  const userId = useAuthStore((state) => state.user?.id);
  const { mutate, isLoading } = useOrders().closeOrders;

  const { allCount, mineCount } = useMemo(() => {
    const closable = orders.filter(
      (order) =>
        !order.isClosed &&
        order.isPaid &&
        order.status === OrderStatus.DELIVERED,
    );
    return {
      allCount: closable.length,
      mineCount: closable.filter((order) => order.user?.id === userId).length,
    };
  }, [orders, userId]);

  const closePaidOrders = (
    scope: CloseOrdersDto["scope"],
    onClosed?: () => void,
  ) => {
    mutate(
      { scope },
      {
        onSuccess: (resp) => {
          onClosed?.();
          toast.success(
            t("orders:closePaid.success", {
              count: resp.data?.closedOrderIds.length ?? 0,
            }),
          );
        },
      },
    );
  };

  return { allCount, mineCount, closePaidOrders, isLoading };
};
