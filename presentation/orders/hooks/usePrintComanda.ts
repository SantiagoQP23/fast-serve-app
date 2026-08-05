import { useCallback } from "react";
import { toast } from "sonner-native";
import { Order } from "@/core/orders/models/order.model";
import { ThermalPrinterService } from "@/core/printers/services/thermal-printer.service";
import { ProductionArea } from "@/core/menu/models/producion-area.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useProductionAreasStore } from "@/presentation/production-areas/store/useProductionAreasStore";

export const usePrintComanda = () => {
  const { t } = useTranslation(["common", "orders"]);

  const printComanda = useCallback(
    async (order: Order) => {
      const toastId = toast.loading(t("orders:options.printingComanda"));

      try {
        const { productionAreas } = useProductionAreasStore.getState();

        const detailsByArea = order.details.reduce(
          (acc, detail) => {
            const productArea = detail.product.productionArea;
            if (!productArea) return acc;

            const fullArea = productionAreas.find(
              (pa) => pa.id === productArea.id,
            );
            if (!fullArea || !fullArea.isActive) return acc;

            const areaId = fullArea.id;
            if (!acc[areaId]) {
              acc[areaId] = { area: fullArea, details: [] };
            }
            acc[areaId].details.push(detail);
            return acc;
          },
          {} as Record<
            number,
            { area: ProductionArea; details: Order["details"] }
          >,
        );

        const areaGroups = Object.values(detailsByArea);

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
          if (group.details.length > 0) {
            await ThermalPrinterService.printComanda(
              activePrinter,
              order,
              group.area.name,
              group.details,
              translations,
            );
          }
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
