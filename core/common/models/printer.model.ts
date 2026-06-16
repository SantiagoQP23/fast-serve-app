export type PrinterConnectionType = "TCP" | "USB";

export interface Printer {
  id: string;
  name: string;
  connectionType: PrinterConnectionType;
  ipAddress?: string;
  port: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
