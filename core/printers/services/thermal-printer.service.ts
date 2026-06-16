import { NetPrinter } from "react-native-thermal-receipt-printer";
import { Printer } from "@/core/common/models/printer.model";

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
        // NetPrinter,
      );
      // await NetPrinter.init();
      await NetPrinter.connectPrinter(printer.ipAddress, printer.port);
      NetPrinter.printBill(receipt);
    } else {
      throw new Error("Only TCP printers are supported");
    }
  };
}
