import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useOutboxCounts } from "@/presentation/offline/hooks/useOrderSyncState";
import { useUnprintedTickets } from "@/presentation/orders/hooks/useUnprintedTickets";
import Button from "@/presentation/theme/components/button";
import tw from "@/presentation/theme/lib/tailwind";

// Small pills are ~40dp tall; the slop brings the target to 48dp
const PILL_HIT_SLOP = { top: 4, bottom: 4 };
// Pills come and go as tickets print and changes sync; fade, don't snap
const PILL_ENTER = FadeIn.duration(180);
const PILL_EXIT = FadeOut.duration(140);

/**
 * Home status pills under the Pedidos/Ventas bar: tickets waiting to print and
 * changes not yet synced. Only shown while something is pending; a rejected
 * change turns the sync pill red.
 */
export default function PendingStatusRow() {
  const { t } = useTranslation(["orders"]);
  const router = useRouter();
  const unprinted = useUnprintedTickets().length;
  const restaurantId = useAuthStore((state) => state.currentRestaurant?.id);
  const unsynced = useOutboxCounts(restaurantId);

  if (unprinted === 0 && unsynced.total === 0) return null;

  const hasFailed = unsynced.failed > 0;

  return (
    <Animated.View
      entering={PILL_ENTER}
      exiting={PILL_EXIT}
      style={tw`flex-row flex-wrap gap-2 px-4 pb-2`}
    >
      {unprinted > 0 && (
        <Animated.View entering={PILL_ENTER} exiting={PILL_EXIT}>
          <Button
            label={t("orders:pendingStatus.unprinted", { count: unprinted })}
            leftIcon="printer"
            variant="surface"
            shape="rounded"
            size="small"
            hitSlop={PILL_HIT_SLOP}
            onPress={() => router.push("/(order)/unprinted-tickets")}
          />
        </Animated.View>
      )}
      {unsynced.total > 0 && (
        <Animated.View entering={PILL_ENTER} exiting={PILL_EXIT}>
          <Button
            label={
              hasFailed
                ? t("orders:pendingStatus.failed", { count: unsynced.failed })
                : t("orders:pendingStatus.unsynced", { count: unsynced.total })
            }
            leftIcon={hasFailed ? "circle-alert" : "cloud-upload"}
            variant={hasFailed ? "destructive" : "surface"}
            shape="rounded"
            size="small"
            hitSlop={PILL_HIT_SLOP}
            onPress={() => router.push("/(order)/pending-changes")}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}
