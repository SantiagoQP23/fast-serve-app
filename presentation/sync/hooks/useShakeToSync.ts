import { useCallback, useContext, useRef } from "react";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";
import { queryClient } from "@/app/_layout";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { SocketContext } from "@/presentation/shared/context/SocketContext";
import { useShake } from "@/presentation/shared/hooks/useShake";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { syncQueryKey } from "../sync-query-key";
import { useSyncStore } from "../store/useSyncStore";
import { useShakeToSyncStore } from "../store/useShakeToSyncStore";

/** Shakes this soon after the last one are ignored. */
const SHAKE_COOLDOWN_MS = 5000;

/**
 * Shaking the phone downloads what changed since the last sync: the same
 * incremental sync the app runs when it comes back to the foreground. The
 * "Sincronizando..." pill shows while it runs, and a toast says how it went.
 *
 * Mounted once, in the tabs layout. Can be turned off in Ajustes.
 */
export const useShakeToSync = () => {
  const { t } = useTranslation("common");
  const { online } = useContext(SocketContext);
  const restaurantId = useAuthStore((state) => state.currentRestaurant?.id);
  const authenticated = useAuthStore(
    (state) => state.status === "authenticated",
  );
  const enabled = useShakeToSyncStore((state) => state.enabled);
  const lastShakeRef = useRef(0);

  const onShake = useCallback(async () => {
    const now = Date.now();
    if (now - lastShakeRef.current < SHAKE_COOLDOWN_MS) return;
    if (!restaurantId) return;
    // A sync is already running (foreground, reconnect...): let it finish.
    if (useSyncStore.getState().status === "syncing") return;
    lastShakeRef.current = now;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => {},
    );

    if (!online) {
      toast.info(t("sync.shakeOffline"));
      return;
    }

    // Same query useSync keeps mounted: incremental from the saved cursor.
    await queryClient.refetchQueries(
      { queryKey: syncQueryKey(restaurantId), exact: true },
      { cancelRefetch: false },
    );

    if (useSyncStore.getState().status === "error") {
      toast.error(t("sync.shakeError"));
    } else {
      toast.success(t("sync.shakeDone"));
    }
  }, [online, restaurantId, t]);

  useShake(onShake, enabled && authenticated && !!restaurantId);
};
