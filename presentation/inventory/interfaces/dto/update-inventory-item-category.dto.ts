import type { CreateInventoryItemCategoryDto } from "./create-inventory-item-category.dto";

export interface UpdateInventoryItemCategoryDto
  extends Partial<CreateInventoryItemCategoryDto> {
  id: string;
}
