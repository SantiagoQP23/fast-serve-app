import { InventoryUnit, type InventoryItem } from "./inventory-item.model";

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
 * The lone "1 unit" line that marks an option as tracked as a whole product
 * (e.g. a Coca-Cola), or null when it has no lines or uses ingredients.
 */
export function getWholeProductLine(
  lines: ProductOptionInventoryItem[] | undefined,
): ProductOptionInventoryItem | null {
  if (!lines || lines.length !== 1) return null;
  const [line] = lines;
  return line.quantity === 1 && line.inventoryItem?.unit === InventoryUnit.UNIT
    ? line
    : null;
}

/**
 * Whether a variant's lines are an ingredient recipe: it has linked items
 * and isn't tracked as a whole product (a lone 1-unit line).
 */
export function isIngredientRecipe(
  lines: ProductOptionInventoryItem[] | undefined,
): boolean {
  return !!lines?.length && !getWholeProductLine(lines);
}
