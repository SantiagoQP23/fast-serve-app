import { BillStatus } from "@/core/orders/models/bill.model";
import { useTranslation } from "react-i18next";

export function useBillStatus(status: BillStatus) {
  const { t } = useTranslation(["common", "bills"]);
  const statusLabel = {
    [BillStatus.PAID]: {
      color: "success" as const,
      text: t("bills:details.paid"),
      icon: "checkmark-circle-outline" as const,
    },
    [BillStatus.PARTIALLY_PAID]: {
      color: "info" as const,
      text: t("bills:details.partiallyPaid"),
      icon: "hourglass-outline" as const,
    },
    [BillStatus.OPEN]: {
      color: "warning" as const,
      text: t("bills:details.unpaid"),
      icon: "time-outline" as const,
    },
  };

  const statusInfo = statusLabel[status] ?? statusLabel[BillStatus.OPEN];

  return { status: statusInfo };
}
