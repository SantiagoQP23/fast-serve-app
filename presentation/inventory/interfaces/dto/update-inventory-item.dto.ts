import type { CreateInventoryItemDto } from "./create-inventory-item.dto";

/**
 * Stock isn't part of an update: it only changes through a movement
 * (adjust, purchase, count, sale), so the history can always explain it.
 */
export interface UpdateInventoryItemDto
  extends Partial<Omit<CreateInventoryItemDto, "quantity">> {
  id: string;
}
