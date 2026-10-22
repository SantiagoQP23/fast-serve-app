import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { InventoryRecipeService } from "./inventory-recipe.service";

/**
 * Reloads one variant's recipe lines into the menu kept on the phone. The
 * menu query is only fetched on demand, so invalidating it doesn't refresh
 * the store, and recipe edits send no sync event.
 */
export async function refreshOptionRecipeInMenu(
  productOptionId: number,
): Promise<void> {
  const { products, updateProductOption } = useMenuStore.getState();
  const product = products.find((p) =>
    p.options?.some((option) => option.id === productOptionId),
  );
  const option = product?.options.find((o) => o.id === productOptionId);
  if (!product || !option) return;

  try {
    const lines =
      await InventoryRecipeService.getByProductOption(productOptionId);
    updateProductOption(product.id, { ...option, inventoryItems: lines });
  } catch {
    // Offline or failed: the next menu refresh brings the lines.
  }
}
