import ThermalPrinterModule from "react-native-thermal-printer";
import { Printer } from "@/core/common/models/printer.model";
import { Order } from "@/core/orders/models/order.model";
import { OrderDetailStatus } from "@/core/orders/models/order-detail.model";
import { OrderType } from "@/core/orders/enums/order-type.enum";

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
      `[L]${translations.waiter}: ${order.user?.person.firstName ?? "N/A"}\n` +
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
      `[L]${translations.waiter}: ${order.user.person.firstName} ${order.user.person.lastName}\n` +
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
}
