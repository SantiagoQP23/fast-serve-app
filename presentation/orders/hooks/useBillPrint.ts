import { useCallback } from "react";
import { Bill, BillSource } from "@/core/orders/models/bill.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export const useBillPrint = (bill: Bill | null | undefined) => {
  const { t, language } = useTranslation(["common", "bills", "orders"]);

  const generateBillHtml = useCallback(() => {
    if (!bill) return "";
    const itemsHtml = bill.details
      .map((detail) => {
        const productName =
          bill.source === BillSource.ORDER && detail.orderDetail
            ? detail.orderDetail.product.name
            : detail.product?.name || "";
        const optionName =
          detail.productOption?.name || detail.orderDetail?.productOption?.name;

        return `
        <div style="margin-bottom:6px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <span>${detail.quantity}x ${productName} ${optionName ? `(${optionName})` : ""}</span>
            <span style="white-space:nowrap;margin-left:8px;">${formatCurrency(detail.total)}</span>
          </div>
        </div>
      `;
      })
      .join("");

    const transactionsHtml = bill.transactions
      .map((tx) => {
        let extra = "";
        if (tx.metadata?.type === "CASH") {
          const cashMeta = tx.metadata as {
            cashReceived?: number;
            changeGiven?: number;
          };
          if (cashMeta.cashReceived) {
            extra += `<div style="padding-left:12px;font-size:11px;color:#555;">Recibido: ${formatCurrency(cashMeta.cashReceived)}</div>`;
          }
          if (cashMeta.changeGiven) {
            extra += `<div style="padding-left:12px;font-size:11px;color:#555;">Cambio: ${formatCurrency(cashMeta.changeGiven)}</div>`;
          }
        }
        return `
        <div style="margin-bottom:4px;">
          <div style="display:flex;justify-content:space-between;">
            <span>${tx.paymentMethod?.name || tx.paymentMethod}</span>
            <span>${formatCurrency(tx.amount)}</span>
          </div>
          ${extra}
        </div>
      `;
      })
      .join("");

    const orderInfoHtml = bill.order
      ? `
          <div class="row-start">
            <span>${t("orders:details.orderNumber", { num: bill.order.num })}</span>
          </div>
          <div class="row-start">
            <span>${bill.order.table ? `${t("common:labels.table")}: ${bill.order.table.name}` : t("common:labels.takeAway")}</span>
          </div>
          <div class="row-start">
            <span>${t("common:labels.waiter")}: ${bill.owner.person.firstName} ${bill.owner.person.lastName}</span>
          </div>
      `
      : "";

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
            ${t("bills:list.title")} #${bill.num}
          </div>
          <div class="center" style="margin-bottom:4px;">
            ${new Date(bill.createdAt).toLocaleString(language)}
          </div>

          <div class="divider"></div>

          ${orderInfoHtml}

          <div class="divider"></div>

          ${itemsHtml}

          <div class="divider"></div>

          <div class="row-start" style="justify-content:space-between;">
            <span>${t("bills:details.subtotal")}</span>
            <span>${formatCurrency(bill.subtotal)}</span>
          </div>
          ${
            bill.discount > 0
              ? `
          <div class="row-start" style="justify-content:space-between;">
            <span>${t("bills:details.discount")}</span>
            <span style="color:green;">-${formatCurrency(bill.discount)}</span>
          </div>
          `
              : ""
          }
          <div class="row-start" style="justify-content:space-between;font-size:15px;">
            <span><b>${t("bills:details.total")}</b></span>
            <span><b>${formatCurrency(bill.total)}</b></span>
          </div>

          ${
            bill.transactions.length > 0
              ? `
          <div class="divider"></div>
          <div class="center" style="margin-bottom:4px;">
            ${t("bills:details.payments")}
          </div>
          ${transactionsHtml}
          `
              : ""
          }

          <div class="divider"></div>

          <div class="footer">
            ${new Date().toLocaleString(language)}
          </div>
        </body>
      </html>
    `;
  }, [bill, t, language]);

  const handlePrintBill = useCallback(async () => {
    if (!bill) return;
    try {
      const html = generateBillHtml();
      const height = Math.max(
        600,
        400 + bill.details.length * 80 + bill.transactions.length * 60,
      );
      const { uri } = await Print.printToFileAsync({
        html,
        width: 204,
        height,
      });
      await Print.printAsync({ uri });
    } catch (error) {
      console.error("Error printing bill:", error);
    }
  }, [generateBillHtml, bill]);

  const handleShareBill = useCallback(async () => {
    if (!bill) return;
    try {
      const html = generateBillHtml();
      const height = Math.max(
        600,
        400 + bill.details.length * 80 + bill.transactions.length * 60,
      );
      const { uri } = await Print.printToFileAsync({
        html,
        width: 204,
        height,
      });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `${t("bills:list.title")} #${bill.num}`,
      });
    } catch (error) {
      console.error("Error sharing bill:", error);
    }
  }, [generateBillHtml, bill, t]);

  return {
    handlePrintBill,
    handleShareBill,
  };
};
