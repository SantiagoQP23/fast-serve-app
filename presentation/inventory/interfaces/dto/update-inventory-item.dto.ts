import type { CreateInventoryItemDto } from "./create-inventory-item.dto";

export interface UpdateInventoryItemDto
  extends Partial<CreateInventoryItemDto> {
  id: string;
}
