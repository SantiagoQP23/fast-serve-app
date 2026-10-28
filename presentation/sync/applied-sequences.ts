import { SyncEventDto } from "@/core/sync/dto/sync-response.dto";
import { Product } from "@/core/menu/models/product.model";

// The newest event applied to each product and each inventory item. Events
// can arrive late (a slow socket message, a sync replaying events already
// applied live), and an older one must not overwrite newer stock.
const productSequences = new Map<string, number>();
const itemSequences = new Map<string, number>();
// Everything up to here came with the last snapshot.
let floor = 0;

export function resetAppliedSequences(snapshotSequence = 0) {
  productSequences.clear();
  itemSequences.clear();
  floor = snapshotSequence;
}

const productSequence = (id: string) =>
  Math.max(floor, productSequences.get(id) ?? 0);
const itemSequence = (id: string) =>
  Math.max(floor, itemSequences.get(id) ?? 0);

/** True when this product already has this event or a newer one. */
export function isStaleProductEvent(event: SyncEventDto): boolean {
  return (
    !!event.sequence && productSequence(event.resourceId) >= event.sequence
  );
}

/** True when this item already has this event's stock or newer. */
export function isStaleItemChange(itemId: string, sequence: number): boolean {
  return !!sequence && itemSequence(itemId) >= sequence;
}

export function markItemApplied(itemId: string, sequence: number) {
  if (sequence && sequence > (itemSequences.get(itemId) ?? 0))
    itemSequences.set(itemId, sequence);
}

/**
 * Records `product` as applied at the event's sequence. Its ingredients
 * that a newer stock event already updated keep the stored (newer) data.
 */
export function applyProductSequence(
  event: SyncEventDto,
  product: Product,
  stored: Product | undefined,
): Product {
  if (!event.sequence) return product;
  productSequences.set(event.resourceId, event.sequence);

  let changed = false;
  const options = product.options?.map((option) => {
    if (!option.inventoryItems?.length) return option;
    const storedLines =
      stored?.options?.find((o) => o.id === option.id)?.inventoryItems ?? [];
    const inventoryItems = option.inventoryItems.map((line) => {
      const id = line.inventoryItem?.id;
      if (!id) return line;
      if (!isStaleItemChange(id, event.sequence)) {
        markItemApplied(id, event.sequence);
        return line;
      }
      const newer = storedLines.find(
        (storedLine) => storedLine.inventoryItem?.id === id,
      )?.inventoryItem;
      if (!newer) return line;
      changed = true;
      return { ...line, inventoryItem: newer };
    });
    return { ...option, inventoryItems };
  });

  return changed ? { ...product, options: options! } : product;
}
