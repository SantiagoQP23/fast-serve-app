import { queryClient } from "@/app/_layout";
import { inventoryItemsQueryKey } from "@/presentation/inventory/hooks/useInventoryItems";

const THROTTLE_MS = 2000;
let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * The inventory screens read the server, not the menu, so stock changes
 * from other phones (a sale, a purchase) mark them stale here. Only open
 * screens refetch; a burst of events costs one refetch every 2 s at most.
 */
export function refreshInventoryQueries() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    queryClient.invalidateQueries({ queryKey: inventoryItemsQueryKey });
    queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
    queryClient.invalidateQueries({ queryKey: ["inventory-recipes"] });
  }, THROTTLE_MS);
}
