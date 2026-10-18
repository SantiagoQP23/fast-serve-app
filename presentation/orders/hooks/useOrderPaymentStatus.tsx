import { OrderPaymentStatus } from "@/core/orders/enums/order-payment-status.enum";
import { useTranslation } from "react-i18next";

export function useOrderPaymentStatus(
  status: OrderPaymentStatus | null | undefined,
) {
  const safeStatus = status ?? OrderPaymentStatus.UNPAID;
  const { t } = useTranslation(["common", "bills"]);
  const statusLabel = {
    [OrderPaymentStatus.PAID]: {
      color: "success" as const,
      text: t("bills:details.paid"),
      icon: "circle-check" as const,
    },
    [OrderPaymentStatus.PARTIALLY_PAID]: {
      color: "info" as const,
      text: t("bills:details.partiallyPaid"),
      icon: "hourglass" as const,
    },
    [OrderPaymentStatus.UNPAID]: {
      color: "warning" as const,
      text: t("bills:details.unpaid"),
      icon: "clock" as const,
    },
  };

  const paymentStatus =
    statusLabel[safeStatus] ?? statusLabel[OrderPaymentStatus.UNPAID];

  return { paymentStatus };
}
