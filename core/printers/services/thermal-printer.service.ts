import { NetPrinter } from "react-native-thermal-receipt-printer";
import { Printer } from "@/core/common/models/printer.model";
import { Order } from "@/core/orders/models/order.model";

export class ThermalPrinterService {
  static printTest = async (
    printer: Printer,
    restaurantName?: string,
  ): Promise<void> => {
    const receipt = `
<C>TEST PRINT</C>
<B>----------------</B>
Restaurant: ${restaurantName || "N/A"}
Printer: ${printer.name}
Type: ${printer.connectionType}
IP: ${printer.ipAddress || "N/A"}
Port: ${printer.port}
Date: ${new Date().toLocaleString()}
<B>----------------</B>
<C>Printer OK</C>
    `;

    if (printer.connectionType === "TCP") {
      if (!printer.ipAddress) {
        throw new Error("TCP printer is missing IP address");
      }
      console.log(
        "Connecting to printer at",
        printer.ipAddress,
        "on port",
        printer.port,
      );
      await NetPrinter.connectPrinter(printer.ipAddress, printer.port);
      NetPrinter.printBill(receipt);
    } else {
      throw new Error("Only TCP printers are supported");
    }
  };

  static printOrder = async (
    printer: Printer,
    order: Order,
    translations: Record<string, string>,
  ): Promise<void> => {
    const separator = "<B>------------------------------</B>";

    const detailsText = order.details
      .map((detail) => {
        const lineTotal = (detail.quantity * detail.price).toFixed(2);
        let extra = "";
        if (detail.productOption) {
          extra += `   ${detail.productOption.name}\n`;
        }
        if (detail.tags.length) {
          extra += `   ${detail.tags.map((t) => t.name).join(", ")}\n`;
        }
        if (detail.description) {
          extra += `   ${detail.description}\n`;
        }
        extra += `   $${detail.price.toFixed(2)} / ${translations.quantity}\n`;

        return `${detail.quantity}x ${detail.product.name}\n${extra}<R>$${lineTotal}</R>`;
      })
      .join("\n");

    const receipt = `
<C><B>${translations.orderNumber}</B></C>
<C>${order.table ? `${translations.table}: ${order.table.name}` : translations.takeAway}</C>
${separator}
<L>${translations.waiter}: ${order.user?.name ?? "N/A"}</L>
<L>${translations.date}: ${new Date(order.createdAt).toLocaleString()}</L>
<L>${translations.status}: ${translations.orderStatus}</L>
<L>${translations.payment}: ${translations.paymentStatus} | ${order.isPaid ? translations.paid : translations.unpaid}</L>
<L>${translations.type}: ${translations.orderType}</L>
<L>${translations.people}: ${order.people}</L>
${order.deliveryTime ? `<L>${translations.deliveryTime}: ${new Date(order.deliveryTime).toLocaleString()}</L>\n` : ""}${order.notes ? `${separator}\n<L>${translations.notes}: ${order.notes}</L>\n` : ""}${separator}
${detailsText}
${separator}
<R><B>${translations.total}: $${order.total.toFixed(2)}</B></R>
${separator}
<C>${new Date().toLocaleString()}</C>
    `;

    if (printer.connectionType === "TCP") {
      if (!printer.ipAddress) {
        throw new Error("TCP printer is missing IP address");
      }
      await NetPrinter.connectPrinter(printer.ipAddress, printer.port);
      NetPrinter.printBill(receipt);
    } else {
      throw new Error("Only TCP printers are supported");
    }
  };
}
