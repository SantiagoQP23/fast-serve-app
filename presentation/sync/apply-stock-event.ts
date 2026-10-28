import { SyncEventDto } from "@/core/sync/dto/sync-response.dto";
import { InventoryItem } from "@/core/inventory/models/inventory-item.model";
import { Product } from "@/core/menu/models/product.model";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { isStaleItemChange, markItemApplied } from "./applied-sequences";
import { refreshInventoryQueries } from "./refresh-inventory-queries";

interface StockEventData {
  items: (Partial<InventoryItem> & { id: string })[];
}

/**
 * A sale or stock change sends the ingredients whose stock changed, once,
 * instead of every product that uses them. Products keep their ingredients
 * in options[].inventoryItems, so the new amounts are written there and the
 * availability the menu shows is recalculated from them as before.
 */
export function applyStockEvents(events: SyncEventDto[]) {
  const changes = new Map<string, Partial<InventoryItem>>();
  for (const event of events) {
    for (const item of (event.data as StockEventData)?.items ?? []) {
      // An older event arriving late must not undo newer stock.
      if (isStaleItemChange(item.id, event.sequence)) continue;
      markItemApplied(item.id, event.sequence);
      changes.set(item.id, { ...changes.get(item.id), ...item });
    }
  }
  if (!changes.size) return;
  refreshInventoryQueries();

  const updated: Product[] = [];
  for (const product of useMenuStore.getState().products) {
    let touched = false;
    const options = product.options?.map((option) => {
      if (!option.inventoryItems?.length) return option;
      let optionTouched = false;
      const inventoryItems = option.inventoryItems.map((line) => {
        const id = line.inventoryItem?.id ?? line.inventoryItemId;
        const change = id ? changes.get(id) : undefined;
        if (!change || !line.inventoryItem) return line;
        optionTouched = true;
        return {
          ...line,
          inventoryItem: { ...line.inventoryItem, ...change },
        };
      });
      if (!optionTouched) return option;
      touched = true;
      return { ...option, inventoryItems };
    });
    if (touched) updated.push({ ...product, options: options! });
  }

  // Orders show names and prices, not stock, so only the menu changes.
  if (updated.length) useMenuStore.getState().upsertProducts(updated);
}
