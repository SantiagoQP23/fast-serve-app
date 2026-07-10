import { Printer } from "@/core/common/models/printer.model";

export interface ProductionArea {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  printers: Printer[];
  createdAt: Date;
  updatedAt: Date;
}
