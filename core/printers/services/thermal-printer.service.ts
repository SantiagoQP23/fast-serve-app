import ThermalPrinterModule from "react-native-thermal-printer";
import { Printer } from "@/core/common/models/printer.model";
import { Order } from "@/core/orders/models/order.model";
import { OrderDetailStatus } from "@/core/orders/models/order-detail.model";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { TicketItem } from "@/core/tickets/models/ticket-item.model";
import { TicketType } from "@/core/tickets/enums/ticket-type.enum";
import { Bill, BillSource } from "@/core/orders/models/bill.model";

export class ThermalPrinterService {
  static printTest = async (
    printer: Printer,
    restaurantName?: string,
  ): Promise<void> => {
    const payload =
      `[C]<b>TEST PRINT</b>\n` +
      `[C]================================\n` +
      `[L]Restaurant: ${restaurantName || "N/A"}\n` +
      `[L]Printer: ${printer.name}\n` +
      `[L]Type: ${printer.connectionType}\n` +
      `[L]IP: ${printer.ipAddress || "N/A"}\n` +
      `[L]Port: ${printer.port}\n` +
      `[L]Date: ${new Date().toLocaleString()}\n` +
      `[C]================================\n` +
      `[C]Printer OK\n` +
      `[C]\n` +
      `[C]\n` +
      `[C]\n`;
    if (printer.connectionType === "TCP") {
      if (!printer.ipAddress) {
        throw new Error("TCP printer is missing IP address");
      }
      await ThermalPrinterModule.printTcp({
        ip: printer.ipAddress,
        port: printer.port,
        payload,
        autoCut: true,
      });
    } else {
      throw new Error("Only TCP printers are supported");
    }
  };

  static printOrder = async (
    printer: Printer,
    order: Order,
    translations: Record<string, string>,
  ): Promise<void> => {
    const detailsText = order.details
      .map((detail) => {
        const lineTotal = (detail.quantity * detail.price).toFixed(2);
        let extra = "";
        if (detail.productOption) {
          extra += `[L]  + ${detail.productOption.name}\n`;
        }
        if (detail.tags.length) {
          extra += `[L]  + ${detail.tags.map((t) => t.name).join(", ")}\n`;
        }
        if (detail.description) {
          extra += `[L]  + ${detail.description}\n`;
        }
        extra += `[L]  $${detail.price.toFixed(2)} / ${translations.quantity}\n`;

        return `[L]<b>${detail.quantity}x ${detail.product.name}</b>[R]$${lineTotal}\n${extra}`;
      })
      .join("");

    const payload =
      `[C]<b>${translations.orderNumber}</b>\n` +
      `[C]${order.table ? `${translations.table}: ${order.table.name}` : translations.takeAway}\n` +
      `[C]================================\n` +
      `[L]${translations.waiter}: ${order.user?.person.firstName ?? translations.deletedUser}\n` +
      `[L]${translations.date}: ${new Date(order.createdAt).toLocaleString()}\n` +
      `[L]${translations.status}: ${translations.orderStatus}\n` +
      `[L]${translations.payment}: ${translations.paymentStatus} | ${order.isPaid ? translations.paid : translations.unpaid}\n` +
      `[L]${translations.type}: ${translations.orderType}\n` +
      `[L]${translations.people}: ${order.people}\n` +
      `${order.deliveryTime ? `[L]${translations.deliveryTime}: ${new Date(order.deliveryTime).toLocaleString()}\n` : ""}` +
      `${order.notes ? `[C]--------------------------------\n[L]${translations.notes}: ${order.notes}\n` : ""}` +
      `[C]================================\n` +
      `${detailsText}` +
      `[C]================================\n` +
      `[R]<b>${translations.total}: $${order.total.toFixed(2)}</b>\n` +
      `[C]================================\n` +
      `[C]${new Date().toLocaleString()}\n`;

    if (printer.connectionType === "TCP") {
      if (!printer.ipAddress) {
        throw new Error("TCP printer is missing IP address");
      }
      await ThermalPrinterModule.printTcp({
        ip: printer.ipAddress,
        port: printer.port,
        payload,
        autoCut: true,
      });
    } else {
      throw new Error("Only TCP printers are supported");
    }
  };

  static printComanda = async (
    printer: Printer,
    order: Order,
    areaName: string,
    areaDetails: Order["details"],
    translations: {
      comandaTitle: string;
      area: (name: string) => string;
      order: string;
      table: (name: string) => string;
      takeAway: string;
      waiter: string;
      date: string;
      people: string;
      notes: string;
      inPlace: string;
      detailTakeAway: string;
      deletedUser: string;
    },
  ): Promise<void> => {
    const detailsText = areaDetails
      .filter(
        (d) =>
          d.status !== OrderDetailStatus.CANCELLED &&
          d.status !== OrderDetailStatus.DELIVERED,
      )
      .map((detail) => {
        let extra = "";

        const showProductOptionName =
          detail.product.options.length > 1 && detail.productOption;

        if (showProductOptionName) {
          extra += `[L] ${detail.productOption!.name}\n`;
        } else {
          extra += `\n`;
        }
        if (detail.tags.length) {
          extra += `[L]  + ${detail.tags.map((t) => t.name).join(", ")}\n`;
        }
        if (detail.description) {
          extra += `[L]  *** ${detail.description} ***\n`;
        }
        if (detail.typeOrderDetail !== order.type) {
          const typeLabel =
            detail.typeOrderDetail === OrderType.TAKE_AWAY
              ? translations.detailTakeAway
              : translations.inPlace;
          extra += `[L]  [${typeLabel}]\n`;
        }

        return `[L]${detail.quantity - detail.qtyDelivered} - ${detail.product.name}${extra}`;
      })
      .join("");

    const payload =
      `[C]${translations.comandaTitle}\n` +
      `[C]${translations.area(areaName).toUpperCase()}\n` +
      `[C]\n` +
      `[C]${translations.order}\n` +
      `[C]<font size='big'>${order.table ? translations.table(order.table.name) : translations.takeAway}</font>\n` +
      `[C]\n` +
      `[L]${translations.waiter}: ${order.user?.person.firstName ?? translations.deletedUser} ${order.user?.person.lastName ?? ""}\n` +
      `[L]${translations.date}: ${new Date(order.createdAt).toLocaleString()}\n` +
      `[L]${translations.people}: ${order.people}\n` +
      `${order.notes ? `[C]-------------------------------------\n[L]${translations.notes}: ${order.notes}\n` : ""}` +
      `[C]\n` +
      `[C]----------------------------------------------\n` +
      `${detailsText}` +
      `[C]-----------------------------------------------\n` +
      `[C]${new Date().toLocaleString()}\n` +
      `[C]\n` +
      `[C]\n` +
      `\x1B\x42\x03\x03 \n` +
      `[C]\n`;

    if (printer.connectionType === "TCP") {
      if (!printer.ipAddress) {
        throw new Error("TCP printer is missing IP address");
      }
      await ThermalPrinterModule.printTcp({
        ip: printer.ipAddress,
        port: printer.port,
        payload,
        autoCut: true,
        printerWidthMM: 80,
        mmFeedPaper: 10,
      });
    } else {
      throw new Error("Only TCP printers are supported");
    }
  };

  static printTicket = async (
    printer: Printer,
    order: Order,
    areaName: string,
    areaItems: TicketItem[],
    ticketType: TicketType,
    ticketTypeLabel: string,
    translations: {
      comandaTitle: string;
      area: (name: string) => string;
      order: string;
      table: (name: string) => string;
      takeAway: string;
      waiter: string;
      date: string;
      people: string;
      notes: string;
      inPlace: string;
      detailTakeAway: string;
      deletedUser: string;
      itemAction: (action: TicketItem["action"]) => string;
    },
  ): Promise<void> => {
    const isCancel = ticketType === TicketType.CANCEL;
    const isUpdate = ticketType === TicketType.UPDATE;
    const qtyPrefix = isCancel ? "-" : "";

    const detailsText = areaItems
      .map((item) => {
        let extra = "";

        if (item.productOptionName) {
          extra += `[L] ${item.productOptionName}\n`;
        } else {
          extra += `\n`;
        }
        if (item.tagsSnapshot) {
          extra += `[L]  + ${item.tagsSnapshot}\n`;
        }
        if (item.description) {
          extra += `[L]  *** ${item.description} ***\n`;
        }
        if (item.orderDetail && item.orderDetail.typeOrderDetail !== order.type) {
          const typeLabel =
            item.orderDetail.typeOrderDetail === OrderType.TAKE_AWAY
              ? translations.detailTakeAway
              : translations.inPlace;
          extra += `[L]  [${typeLabel}]\n`;
        }

        const actionPrefix = isUpdate
          ? `${translations.itemAction(item.action)} `
          : "";

        return `[L]${actionPrefix}${qtyPrefix}${item.quantity} - ${item.productName}${extra}`;
      })
      .join("");

    const payload =
      `[C]${translations.comandaTitle}\n` +
      `[C]${translations.area(areaName).toUpperCase()}\n` +
      `[C]<font size='big'><b>${ticketTypeLabel}</b></font>\n` +
      `[C]\n` +
      `[C]${translations.order}\n` +
      `[C]<font size='big'>${order.table ? translations.table(order.table.name) : translations.takeAway}</font>\n` +
      `[C]\n` +
      `[L]${translations.waiter}: ${order.user?.person.firstName ?? translations.deletedUser} ${order.user?.person.lastName ?? ""}\n` +
      `[L]${translations.date}: ${new Date(order.createdAt).toLocaleString()}\n` +
      `[L]${translations.people}: ${order.people}\n` +
      `${order.notes ? `[C]-------------------------------------\n[L]${translations.notes}: ${order.notes}\n` : ""}` +
      `[C]\n` +
      `[C]----------------------------------------------\n` +
      `${detailsText}` +
      `[C]-----------------------------------------------\n` +
      `[C]${new Date().toLocaleString()}\n` +
      `[C]\n` +
      `[C]\n` +
      `\x1B\x42\x03\x03 \n` +
      `[C]\n`;

    if (printer.connectionType === "TCP") {
      if (!printer.ipAddress) {
        throw new Error("TCP printer is missing IP address");
      }
      await ThermalPrinterModule.printTcp({
        ip: printer.ipAddress,
        port: printer.port,
        payload,
        autoCut: true,
        printerWidthMM: 80,
        mmFeedPaper: 10,
      });
    } else {
      throw new Error("Only TCP printers are supported");
    }
  };

  static printBill = async (
    printer: Printer,
    bill: Bill,
    translations: {
      title: string;
      orderNumber: string;
      table: (name: string) => string;
      takeAway: string;
      waiter: string;
      deletedUser: string;
      subtotal: string;
      discount: string;
      total: string;
      payments: string;
    },
  ): Promise<void> => {
    const itemsText = bill.details
      .map((detail) => {
        const productName =
          bill.source === BillSource.ORDER && detail.orderDetail
            ? detail.orderDetail.product.name
            : detail.product?.name || "";
        const optionName =
          detail.productOption?.name || detail.orderDetail?.productOption?.name;

        return `[L]${detail.quantity}x ${productName}${optionName ? ` (${optionName})` : ""}[R]$${detail.total.toFixed(2)}\n`;
      })
      .join("");

    const transactionsText = bill.transactions
      .map(
        (tx) =>
          `[L]${tx.paymentMethod?.name}[R]$${tx.amount.toFixed(2)}\n`,
      )
      .join("");

    const orderInfoText = bill.order
      ? `[C]${translations.orderNumber}\n` +
        `[C]${bill.order.table ? translations.table(bill.order.table.name) : translations.takeAway}\n` +
        `[L]${translations.waiter}: ${bill.owner?.person.firstName ?? translations.deletedUser}\n` +
        `[C]--------------------------------\n`
      : "";

    const payload =
      `[C]<font size='big'><b>${translations.title} #${bill.num}</b></font>\n` +
      `[C]${new Date(bill.createdAt).toLocaleString()}\n` +
      `[C]--------------------------------\n` +
      `${orderInfoText}` +
      `${itemsText}` +
      `[C]--------------------------------\n` +
      `[L]${translations.subtotal}[R]$${bill.subtotal.toFixed(2)}\n` +
      `${bill.discount > 0 ? `[L]${translations.discount}[R]-$${bill.discount.toFixed(2)}\n` : ""}` +
      `[L]<b>${translations.total}</b>[R]<b>$${bill.total.toFixed(2)}</b>\n` +
      `${
        bill.transactions.length > 0
          ? `[C]--------------------------------\n[C]${translations.payments}\n${transactionsText}`
          : ""
      }` +
      `[C]--------------------------------\n` +
      `[C]${new Date().toLocaleString()}\n` +
      `[C]\n` +
      `[C]\n` +
      `\x1B\x42\x03\x03 \n` +
      `[C]\n`;

    if (printer.connectionType === "TCP") {
      if (!printer.ipAddress) {
        throw new Error("TCP printer is missing IP address");
      }
      await ThermalPrinterModule.printTcp({
        ip: printer.ipAddress,
        port: printer.port,
        payload,
        autoCut: true,
        printerWidthMM: 80,
        mmFeedPaper: 10,
      });
    } else {
      throw new Error("Only TCP printers are supported");
    }
  };
}
