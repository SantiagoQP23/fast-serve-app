import { useCallback } from "react";
import { toast } from "sonner-native";
import { Ticket } from "@/core/tickets/models/ticket.model";
import { ThermalPrinterService } from "@/core/printers/services/thermal-printer.service";
import { ProductionArea } from "@/core/menu/models/producion-area.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useProductionAreasStore } from "@/presentation/production-areas/store/useProductionAreasStore";
import { TicketsService } from "@/core/tickets/services/tickets.service";
import { Order } from "@/core/orders/models/order.model";

export const usePrintComanda = () => {
  const { t } = useTranslation(["common", "orders"]);

  const printComanda = useCallback(
    async (order: Order, ticket: Ticket) => {
      const toastId = toast.loading(t("orders:options.printingComanda"));

      try {
        const { productionAreas } = useProductionAreasStore.getState();

        const itemsByArea = ticket.items.reduce(
          (acc, item) => {
            const areaId = item.productionAreaId ?? 0;
            if (!areaId) return acc;

            const fullArea = productionAreas.find((pa) => pa.id === areaId);
            if (!fullArea || !fullArea.isActive) return acc;

            if (!acc[areaId]) {
              acc[areaId] = { area: fullArea, items: [] };
            }
            acc[areaId].items.push(item);
            return acc;
          },
          {} as Record<
            number,
            { area: ProductionArea; items: Ticket["items"] }
          >,
        );

        const areaGroups = Object.values(itemsByArea);

        if (areaGroups.length === 0) {
          toast.error(t("orders:options.noProductionAreas"), { id: toastId });
          return;
        }

        const translations = {
          comandaTitle: t("orders:comanda.title"),
          area: (name: string) => t("orders:comanda.area", { area: name }),
          order: t("orders:comanda.order", { num: order.num }),
          table: (name: string) => t("orders:comanda.table", { name }),
          takeAway: t("orders:comanda.takeAway"),
          waiter: t("orders:comanda.waiter"),
          date: t("orders:comanda.date"),
          people: t("orders:comanda.people"),
          notes: t("orders:comanda.notes"),
          inPlace: t("orders:comanda.inPlace"),
          detailTakeAway: t("orders:comanda.detailTakeAway"),
        };

        for (const group of areaGroups) {
          const activePrinter = group.area.printers?.find((p) => p.isActive);
          if (!activePrinter) {
            console.warn(
              `No active printer found for production area: ${group.area.name}`,
            );
            continue;
          }
          if (group.items.length > 0) {
            await ThermalPrinterService.printTicket(
              activePrinter,
              order,
              group.area.name,
              group.items,
              translations,
            );
          }
        }

        // Mark ticket as printed via REST
        try {
          await TicketsService.markTicketPrinted(ticket.id);
        } catch (e) {
          console.warn("Failed to mark ticket as printed:", e);
        }

        toast.success(t("orders:options.printComandaSuccess"), { id: toastId });
      } catch (error) {
        console.error("Error printing comanda:", error);
        toast.error(t("orders:options.printComandaError"), { id: toastId });
      }
    },
    [t],
  );

  return { printComanda };
};
