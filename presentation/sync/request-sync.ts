import { queryClient } from "@/app/_layout";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { syncQueryKey } from "./sync-query-key";

/** After this phone's own inventory change: its sync event is out by then. */
export const SELF_CHECK_DELAY_MS = 500;

let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Runs an incremental sync soon (joining one already running), so several
 * requests in a row cost one request. Used when a live event shows a gap
 * in the sequence and after this phone changes the inventory itself.
 */
export function requestSync(delayMs = 1000) {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    const restaurantId = useAuthStore.getState().currentRestaurant?.id;
    if (!restaurantId) return;
    void queryClient.refetchQueries(
      { queryKey: syncQueryKey(restaurantId), exact: true },
      { cancelRefetch: false },
    );
  }, delayMs);
}
