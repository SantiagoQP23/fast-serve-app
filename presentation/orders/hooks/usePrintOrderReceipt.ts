import { useCallback } from "react";
import { toast } from "sonner-native";
import { Order } from "@/core/orders/models/order.model";
import { OrderPaymentStatus } from "@/core/orders/enums/order-payment-status.enum";
import { Printer } from "@/core/common/models/printer.model";
import { ThermalPrinterService } from "@/core/printers/services/thermal-printer.service";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
const toCamelCase = (str: string) =>
  str.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

export const usePrintOrderReceipt = (order: Order | null) => {
  const { t } = useTranslation(["common", "orders", "bills"]);

  const printOrderReceipt = useCallback(
    async (printer: Printer) => {
      if (!order) return;
      const toastId = toast.loading(t("orders:options.printingOrder"));
      try {
        const orderStatusLabel = t(`common:status.${toCamelCase(order.status)}`);
        const orderTypeLabel = t(`common:orderType.${toCamelCase(order.type)}`);
        const paymentStatusLabel =
          order.paymentStatus === OrderPaymentStatus.PARTIALLY_PAID
            ? t("bills:partiallyPaid")
            : t(`common:status.${toCamelCase(order.paymentStatus)}`);

        await ThermalPrinterService.printOrder(printer, order, {
          orderNumber: t("orders:details.orderNumber", { num: order.num }),
          table: t("common:labels.table"),
          takeAway: t("common:labels.takeAway"),
          waiter: t("common:labels.waiter"),
          deletedUser: t("common:labels.deletedUser"),
          date: t("common:labels.date"),
          status: t("orders:print.status"),
          orderStatus: orderStatusLabel,
          payment: t("orders:print.payment"),
          paymentStatus: paymentStatusLabel,
          paid: t("common:status.paid"),
          unpaid: t("common:status.unpaid"),
          type: t("orders:print.type"),
          orderType: orderTypeLabel,
          people: t("common:labels.people"),
          deliveryTime: t("orders:details.deliveryTime"),
          notes: t("common:labels.notes"),
          total: t("common:labels.total"),
          quantity: t("common:labels.quantity"),
        });

        toast.success(t("orders:options.printOrderSuccess"), { id: toastId });
      } catch (error) {
        console.error("Error printing order:", error);
        toast.error(t("orders:options.printError"), { id: toastId });
      }
    },
    [order, t],
  );

  return { printOrderReceipt };
};
