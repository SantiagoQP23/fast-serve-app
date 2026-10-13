import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { syncQueryKey } from "./useSync";

/**
 * Lets a screen pull-to-refresh through the sync endpoint. It re-runs the
 * query `useSync` keeps mounted in the tabs layout, so the response is applied
 * to the stores the same way (incremental from the saved cursor, or a snapshot).
 */
export const useSyncRefresh = () => {
  const queryClient = useQueryClient();
  const restaurantId = useAuthStore((state) => state.currentRestaurant?.id);

  return useCallback(async () => {
    if (!restaurantId) return;

    // Join a sync that is already running (e.g. the app-foreground one)
    // instead of cancelling it and applying the same events twice.
    await queryClient.refetchQueries(
      { queryKey: syncQueryKey(restaurantId), exact: true },
      { cancelRefetch: false },
    );
  }, [queryClient, restaurantId]);
};
