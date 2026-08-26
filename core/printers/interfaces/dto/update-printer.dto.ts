import type { CreatePrinterDto } from "./create-printer.dto";

export interface UpdatePrinterDto extends CreatePrinterDto {
  id: string;
}
