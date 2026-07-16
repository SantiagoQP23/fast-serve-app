import ThermalPrinterModule from "react-native-thermal-printer";
import { Printer } from "@/core/common/models/printer.model";
import { Order } from "@/core/orders/models/order.model";
import { OrderDetailStatus } from "@/core/orders/models/order-detail.model";

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
      `[C]Printer OK\n`;

    if (printer.connectionType === "TCP") {
      if (!printer.ipAddress) {
        throw new Error("TCP printer is missing IP address");
      }
      await ThermalPrinterModule.printTcp({
        ip: printer.ipAddress,
        port: printer.port,
        payload,
        autoCut: false,
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
          extra += `[L]  + ${detail.productOption!.name}\n`;
        }
        if (detail.tags.length) {
          extra += `[L]  + ${detail.tags.map((t) => t.name).join(", ")}\n`;
        }
        if (detail.description) {
          extra += `[L]  *** ${detail.description} ***\n`;
        }

        return `[L]<b>${detail.quantity - detail.qtyDelivered}x ${detail.product.name}</b>\n${extra}`;
      })
      .join("");

    const payload =
      `[C]<b>COMANDA</b>\n` +
      `[C]<b>${areaName.toUpperCase()}</b>\n` +
      `[C]================================\n` +
      `[C]<b>ORDEN #${order.num}</b>\n` +
      `[C]${order.table ? `MESA: ${order.table.name}` : "PARA LLEVAR"}\n` +
      `[C]================================\n` +
      `[L]MESERO: ${order.user.person.firstName} ${order.user.person.lastName}\n` +
      `[L]FECHA: ${new Date(order.createdAt).toLocaleString()}\n` +
      `[L]PERSONAS: ${order.people}\n` +
      `${order.notes ? `[C]--------------------------------\n[L]NOTAS: ${order.notes}\n` : ""}` +
      `[C]================================\n` +
      `${detailsText}` +
      `[C]================================\n` +
      `[C]${new Date().toLocaleString()}\n` +
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
}
