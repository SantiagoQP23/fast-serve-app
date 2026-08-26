import type { PrinterConnectionType } from "@/core/common/models/printer.model";

export interface CreatePrinterDto {
  name: string;
  connectionType: PrinterConnectionType;
  ipAddress?: string;
  port: number;
  isActive?: boolean;
}
