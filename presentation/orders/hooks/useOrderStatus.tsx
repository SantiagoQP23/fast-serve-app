import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { LabelProps } from "@/presentation/theme/components/label";

export function useOrderStatus(status: OrderStatus) {
  const { t } = useTranslation("common");

  const statusText: { [key in OrderStatus]: string } = {
    [OrderStatus.DELIVERED]: t("status.delivered"),
    [OrderStatus.IN_PROGRESS]: t("status.inProgress"),
    [OrderStatus.PENDING]: t("status.pending"),
    [OrderStatus.READY]: t("status.ready"),
    [OrderStatus.CANCELLED]: t("status.cancelled"),
  };

  const statusTextColor: { [key in OrderStatus]: string } = {
    [OrderStatus.DELIVERED]: "text-green-600",
    [OrderStatus.IN_PROGRESS]: "text-blue-700",
    [OrderStatus.PENDING]: "text-orange-500",
    [OrderStatus.READY]: "text-emerald-600",
    [OrderStatus.CANCELLED]: "text-red-500",
  };

  const statusIconColor: { [key in OrderStatus]: string } = {
    [OrderStatus.DELIVERED]: "green-500",
    [OrderStatus.IN_PROGRESS]: "blue-700",
    [OrderStatus.PENDING]: "orange-400",
    [OrderStatus.READY]: "emerald-500",
    [OrderStatus.CANCELLED]: "red-500",
  };

  const backgroundColors: { [key in OrderStatus]: string } = {
    [OrderStatus.DELIVERED]: "bg-green-500",
    [OrderStatus.IN_PROGRESS]: "bg-blue-500",
    [OrderStatus.PENDING]: "bg-orange-500",
    [OrderStatus.READY]: "bg-emerald-500",
    [OrderStatus.CANCELLED]: "bg-red-500",
  };

  const statusIcons: { [key in OrderStatus]: keyof typeof Ionicons.glyphMap } =
    {
      [OrderStatus.PENDING]: "time-outline",
      [OrderStatus.IN_PROGRESS]: "flame-outline",
      [OrderStatus.READY]: "notifications-outline",
      [OrderStatus.DELIVERED]: "checkmark-done-outline",
      [OrderStatus.CANCELLED]: "close-circle-outline",
    };

  const labelColors: { [key in OrderStatus]: LabelProps["color"] } = {
    [OrderStatus.PENDING]: "warning",
    [OrderStatus.IN_PROGRESS]: "info",
    [OrderStatus.DELIVERED]: "default",
    [OrderStatus.READY]: "success",
    [OrderStatus.CANCELLED]: "error",
  };

  return {
    statusText: statusText[status],
    statusTextColor: statusTextColor[status],
    bgColor: backgroundColors[status],
    statusIcon: statusIcons[status],
    statusIconColor: statusIconColor[status],
    labelColor: labelColors[status],
  };
}
