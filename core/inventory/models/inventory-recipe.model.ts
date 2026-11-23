import { isProductStockItem, type InventoryItem } from "./inventory-item.model";

export interface ProductOptionInventoryItem {
  id: string;
  productOptionId: number;
  inventoryItemId: string;
  /** Null only for unlimited insumos listed without an amount. */
  quantity: number | null;
  /**
   * The customer can ask for the dish without it; only these show as chips
   * when ordering (plans/unificar-receta-incluidos.md). Missing on servers
   * older than that plan.
   */
  removable?: boolean;
  /** Zero or negative: what removing it takes off the price. */
  removalPriceDelta?: number;
  /** Position in the recipe and of the chips. */
  order?: number;
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

/**
 * Lines that spend stock: unlimited insumos and lines without an amount
 * never count for "Alcanza para N" or "Agotado".
 */
export function getCountedLines(
  lines: ProductOptionInventoryItem[] | undefined,
): ProductOptionInventoryItem[] {
  return (lines ?? []).filter(
    (line) =>
      !line.inventoryItem?.isUnlimited &&
      line.quantity !== null &&
      Number(line.quantity) > 0,
  );
}

/** Lines in recipe order. */
export function sortRecipeLines(
  lines: ProductOptionInventoryItem[] | undefined,
): ProductOptionInventoryItem[] {
  return [...(lines ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** Id of a line's item; sync events carry only the nested item. */
export const getLineItemId = (line: ProductOptionInventoryItem) =>
  line.inventoryItem?.id ?? line.inventoryItemId;
