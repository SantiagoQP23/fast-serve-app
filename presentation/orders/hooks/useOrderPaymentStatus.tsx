import { OrderPaymentStatus } from "@/core/orders/enums/order-payment-status.enum";
import { useTranslation } from "react-i18next";

export function useOrderPaymentStatus(status: OrderPaymentStatus) {
  const { t } = useTranslation(["common", "bills"]);
  const statusLabel = {
    [OrderPaymentStatus.PAID]: {
      color: "success" as const,
      text: t("bills:details.paid"),
      icon: "checkmark-circle-outline" as const,
    },
    [OrderPaymentStatus.PARTIALLY_PAID]: {
      color: "info" as const,
      text: t("bills:details.partiallyPaid"),
      icon: "hourglass-outline" as const,
    },
    [OrderPaymentStatus.UNPAID]: {
      color: "warning" as const,
      text: t("bills:details.unpaid"),
      icon: "time-outline" as const,
    },
  };

  const paymentStatus =
    statusLabel[status] ?? statusLabel[OrderPaymentStatus.UNPAID];

  return { paymentStatus };
}
