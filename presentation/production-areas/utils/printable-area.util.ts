import { ProductionArea } from "@/core/menu/models/producion-area.model";

/** An area can print comandas when it's active and has an active printer. */
export const isPrintableArea = (area: ProductionArea) =>
  area.isActive && area.printers?.some((printer) => printer.isActive);
