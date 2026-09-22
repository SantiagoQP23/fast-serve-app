import { useCallback } from "react";
import { toast } from "sonner-native";
import { Bill } from "@/core/orders/models/bill.model";
import { Printer } from "@/core/common/models/printer.model";
import { ThermalPrinterService } from "@/core/printers/services/thermal-printer.service";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

export const usePrintBillReceipt = (bill: Bill | null | undefined) => {
  const { t } = useTranslation(["common", "bills", "orders"]);

  const printBillReceipt = useCallback(
    async (printer: Printer) => {
      if (!bill) return;
      const toastId = toast.loading(t("bills:print.printing"));
      try {
        await ThermalPrinterService.printBill(printer, bill, {
          title: t("bills:list.title"),
          orderNumber: bill.order
            ? t("orders:details.orderNumber", { num: bill.order.num })
            : "",
          table: (name: string) => `${t("common:labels.table")}: ${name}`,
          takeAway: t("common:labels.takeAway"),
          waiter: t("common:labels.waiter"),
          deletedUser: t("common:labels.deletedUser"),
          subtotal: t("bills:details.subtotal"),
          discount: t("bills:details.discount"),
          total: t("bills:details.total"),
          payments: t("orders:options.payments"),
        });

        toast.success(t("bills:print.printSuccess"), { id: toastId });
      } catch (error) {
        console.error("Error printing bill:", error);
        toast.error(t("bills:print.printError"), { id: toastId });
      }
    },
    [bill, t],
  );

  return { printBillReceipt };
};
