import { useCallback } from "react";
import { toast } from "sonner-native";
import { Order } from "@/core/orders/models/order.model";
import { OrderPaymentStatus } from "@/core/orders/enums/order-payment-status.enum";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useOrderPaymentStatus } from "./useOrderPaymentStatus";
import { OrderDetailStatus } from "@/core/orders/models/order-detail.model";
import { ThermalPrinterService } from "@/core/printers/services/thermal-printer.service";
import { ProductionArea } from "@/core/menu/models/producion-area.model";
import { useProductionAreas } from "@/presentation/production-areas/hooks/useProductionAreas";

export const useOrderPrint = (order: Order) => {
  const { t, language } = useTranslation(["common", "orders", "bills"]);
  const { paymentStatus } = useOrderPaymentStatus(order.paymentStatus);
  const { productionAreas } = useProductionAreas();

  const toCamelCase = (str: string) =>
    str.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

  const generateOrderHtml = useCallback(() => {
    const orderStatusKey = toCamelCase(order.status);
    const orderStatusLabel = t(`common:status.${orderStatusKey}`);

    const orderTypeKey = toCamelCase(order.type);
    const orderTypeLabel = t(`common:orderType.${orderTypeKey}`);

    let paymentStatusLabel: string;
    if (order.paymentStatus === OrderPaymentStatus.PARTIALLY_PAID) {
      paymentStatusLabel = t("bills:partiallyPaid");
    } else {
      const paymentStatusKey = toCamelCase(order.paymentStatus);
      paymentStatusLabel = t(`common:status.${paymentStatusKey}`);
    }

    const detailsHtml = order.details
      .filter((detail) => detail.status !== OrderDetailStatus.CANCELLED)
      .map((detail) => {
        const showProductOptionName =
          detail.product.options.length > 1 && detail.productOption;
        return `
        <div style="margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <span>${detail.quantity}x ${detail.product.name} ${showProductOptionName ? (detail.productOption ? `${detail.productOption.name}` : "") : ""}</span>
            <span style="white-space:nowrap;margin-left:8px;">$${(detail.quantity * detail.price).toFixed(2)}</span>
          </div>
          ${detail.tags.length ? `<div style="padding-left:12px;font-size:12px;color:#000;">${detail.tags.map((t) => t.name).join(", ")}</div>` : ""}
          ${detail.description ? `<div style="padding-left:12px;font-size:12px;color:#000;">${detail.description}</div>` : ""}
          <div style="padding-left:12px;font-size:12px;color:#333;">
            $${detail.price.toFixed(2)} 
          </div>
        </div>
      `;
      })
      .join("");

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              width: 100%;
              margin: 0;
              font-family: sans-serif;
              font-size: 13px;
              line-height: 1.4;
              color: #222;
              padding: 2mm;
            }
            .center { text-align: center; }
            .divider {
              border-top: 2px dashed #000;
              margin: 6px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }
            .row-start {
              display: flex;
              justify-content: flex-start;
              gap: 4px;
              margin-bottom: 2px;
            }
            .total {
              font-size: 15px;
              text-align: right;
              margin-top: 4px;
            }
            .footer {
              text-align: center;
              font-size: 11px;
              color: #555;
              margin-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="center" style="font-size:16px;margin-bottom:2px;">
            ${t("orders:details.orderNumber", { num: order.num })}
          </div>
          <div class="center" style="margin-bottom:4px;">
            ${order.table ? `${t("common:labels.table")}: ${order.table.name}` : t("common:labels.takeAway")}
          </div>

          <div class="divider"></div>

          <div class="row-start">
            <span>${t("common:labels.waiter")}:</span>
            <span>${order.user.person.firstName} ${order.user.person.lastName}</span>
          </div>
          <div class="row-start">
            <span>${t("common:labels.date")}:</span>
            <span>${new Date(order.createdAt).toLocaleString(language)}</span>
          </div>
          <div class="row-start">
            <span>${t("orders:confirmation.status")}</span>
            <span>${orderStatusLabel} | ${paymentStatus.text}</span>
          </div>
          <div class="row-start">
            <span>${t("orders:newOrder.orderType")}:</span>
            <span>${orderTypeLabel}</span>
          </div>
          <div class="row-start">
            <span>${t("common:labels.people")}:</span>
            <span>${order.people}</span>
          </div>
          ${
            order.deliveryTime
              ? `
          <div class="row-start">
            <span>${t("orders:details.deliveryTime")}:</span>
            <span>${new Date(order.deliveryTime).toLocaleString(language)}</span>
          </div>
          `
              : ""
          }

          ${
            order.notes
              ? `
          <div class="divider"></div>
          <div class="row-start">
            <span>${t("common:labels.notes")}:</span>
            <span>${order.notes}</span>
          </div>
          `
              : ""
          }

          <div class="divider"></div>

          ${detailsHtml}

          <div class="divider"></div>

          <div class="total">
            ${t("orders:confirmation.total")} $${order.total.toFixed(2)}
          </div>

          <div class="divider"></div>

          <div class="footer">
            ${new Date().toLocaleString(language)}
          </div>
<div style="min-height: 100px"></div>
        </body>
      </html>
    `;
  }, [order, t, language]);

  const handlePrintOrder = useCallback(async () => {
    const toastId = toast.loading(t("orders:options.printingOrder"));
    try {
      const html = generateOrderHtml();
      const height = Math.max(600, 400 + order.details.length * 130);
      const { uri } = await Print.printToFileAsync({
        html,
        width: 204,
        height,
      });
      await Print.printAsync({ uri });
      toast.success(t("orders:options.printOrderSuccess"), { id: toastId });
    } catch (error) {
      console.error("Error printing order:", error);
      toast.error(t("orders:options.printError"), { id: toastId });
    }
  }, [generateOrderHtml, order.details.length, t]);

  const handleShareOrder = useCallback(async () => {
    try {
      const html = generateOrderHtml();
      const height = Math.max(600, 400 + order.details.length * 130);
      const { uri } = await Print.printToFileAsync({
        html,
        width: 204,
        height,
      });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: t("orders:details.orderNumber", { num: order.num }),
      });
    } catch (error) {
      console.error("Error sharing order:", error);
    }
  }, [generateOrderHtml, order.details.length, order.num, t]);

  const handlePrintComanda = useCallback(async () => {
    const toastId = toast.loading(t("orders:options.printingComanda"));
    try {
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

      for (const group of areaGroups) {
        const activePrinter = group.area.printers?.find((p) => p.isActive);
        if (!activePrinter) {
          console.warn(
            `No active printer found for production area: ${group.area.name}`,
          );
          continue;
        }
        await ThermalPrinterService.printComanda(
          activePrinter,
          order,
          group.area.name,
          group.details,
        );
      }
      toast.success(t("orders:options.printComandaSuccess"), { id: toastId });
    } catch (error) {
      console.error("Error printing comanda:", error);
      toast.error(t("orders:options.printComandaError"), { id: toastId });
    }
  }, [order, t, productionAreas]);

  return {
    handlePrintOrder,
    handleShareOrder,
    handlePrintComanda,
  };
};
