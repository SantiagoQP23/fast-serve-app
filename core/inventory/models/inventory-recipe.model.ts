import { isProductStockItem, type InventoryItem } from "./inventory-item.model";

export interface ProductOptionInventoryItem {
  id: string;
  productOptionId: number;
  inventoryItemId: string;
  quantity: number;
  createdAt?: string;
  updatedAt?: string;
  inventoryItem?: InventoryItem;
  productOption?: {
    id: number;
    name: string;
    product?: { id: string; name: string };
  };
}

/**
 * The lone 1-unit line to a PRODUCT item that gives a variant its own stock
 * (e.g. a Coca-Cola), or null when it uses a recipe or tracks nothing.
 */
export function getOwnStockLine(
  lines: ProductOptionInventoryItem[] | undefined,
): ProductOptionInventoryItem | null {
  if (!lines || lines.length !== 1) return null;
  const [line] = lines;
  return Number(line.quantity) === 1 && isProductStockItem(line.inventoryItem)
    ? line
    : null;
}

/** Id of a line's item; sync events carry only the nested item. */
export const getLineItemId = (line: ProductOptionInventoryItem) =>
  line.inventoryItem?.id ?? line.inventoryItemId;
