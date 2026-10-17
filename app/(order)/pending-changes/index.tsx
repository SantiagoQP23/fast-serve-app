import { useState } from "react";
import { ScrollView } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useShallow } from "zustand/react/shallow";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import Card from "@/presentation/theme/components/card";
import Button from "@/presentation/theme/components/button";
import Label from "@/presentation/theme/components/label";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { typography } from "@/constants/theme";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useSyncStore } from "@/presentation/sync/store/useSyncStore";
import { syncQueryKey } from "@/presentation/sync/hooks/useSync";
import {
  OutboxOperation,
  selectRestaurantOperations,
  useOutboxStore,
} from "@/presentation/offline/store/useOutboxStore";
import { isCreateOrderOperation } from "@/presentation/offline/hooks/useOutboxRunner";

/**
 * "Cambios sin sincronizar": the actions taken offline that haven't reached
 * the server. A rejected one can be retried or discarded; discarding brings
 * the order back to what the server has.
 */
export default function PendingChangesScreen() {
  const { t } = useTranslation(["common", "orders"]);
  const queryClient = useQueryClient();
  const restaurantId = useAuthStore((state) => state.currentRestaurant?.id);
  // The selector filters, so it returns a new array on every read; useShallow
  // keeps the reference stable while the operations are the same.
  const operations = useOutboxStore(
    useShallow(selectRestaurantOperations(restaurantId)),
  );
  const [toDiscard, setToDiscard] = useState<OutboxOperation | null>(null);

  const retry = (op: OutboxOperation) => {
    useOutboxStore.getState().setStatus(op.id, "pending");
  };

  const discard = (op: OutboxOperation) => {
    const outbox = useOutboxStore.getState();

    if (isCreateOrderOperation(op)) {
      // The order only exists on this phone: drop it and everything queued
      // for it.
      outbox.removeOrder(op.orderId);
      const orders = useOrdersStore.getState();
      orders.deleteOrder(op.orderId);
      if (orders.activeOrder?.id === op.orderId) orders.setActiveOrder(null);
    } else {
      outbox.remove(op.id);
    }

    // The local copy still shows the discarded change; a full sync replaces
    // it with the server's (orders with other queued actions are kept).
    if (restaurantId) {
      useSyncStore.getState().setRestaurantId(restaurantId);
      void queryClient.refetchQueries({
        queryKey: syncQueryKey(restaurantId),
        exact: true,
      });
    }
  };

  const discardMessage = toDiscard
    ? isCreateOrderOperation(toDiscard)
      ? t("orders:offline.discardOrderMessage")
      : t("orders:offline.discardMessage")
    : "";

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`gap-4 px-4 pt-6 pb-6`}
        showsVerticalScrollIndicator={false}
      >
        {operations.length === 0 && (
          <ThemedView style={tw`items-center py-12`}>
            <Ionicons
              name="cloud-done-outline"
              size={48}
              color={tw.color("gray-400")}
            />
            <ThemedText type="body1" style={tw`text-gray-500 mt-4 text-center`}>
              {t("orders:offline.empty")}
            </ThemedText>
          </ThemedView>
        )}

        {operations.length > 0 && (
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {t("orders:offline.description")}
          </ThemedText>
        )}

        {operations.map((op) => (
          <Card key={op.id} variant="outline" style={tw`gap-2 p-4`}>
            <ThemedView style={tw`flex-row items-center justify-between gap-2`}>
              <ThemedText
                type="body1"
                numberOfLines={1}
                style={[tw`flex-1`, { fontFamily: typography.semibold }]}
              >
                {op.orderLabel}
              </ThemedText>
              <Label
                size="small"
                color={op.status === "failed" ? "error" : "warning"}
                text={t(`orders:offline.status.${op.status}`)}
              />
            </ThemedView>

            <ThemedText type="body2">{op.summary}</ThemedText>
            <ThemedText type="small" style={tw`text-gray-500`}>
              {dayjs(op.createdAt).format("HH:mm")}
            </ThemedText>

            {op.status === "failed" && (
              <>
                <ThemedText type="small" style={tw`text-red-600`}>
                  {op.error?.msg || t("orders:offline.rejected")}
                </ThemedText>
                <ThemedView style={tw`flex-row justify-end gap-2`}>
                  <Button
                    variant="text"
                    size="small"
                    label={t("orders:offline.discard")}
                    onPress={() => setToDiscard(op)}
                  />
                  <Button
                    variant="secondary"
                    size="small"
                    leftIcon="refresh-outline"
                    label={t("orders:offline.retry")}
                    onPress={() => retry(op)}
                  />
                </ThemedView>
              </>
            )}
          </Card>
        ))}
      </ScrollView>

      <DialogModal
        visible={!!toDiscard}
        title={t("orders:offline.discardTitle")}
        message={discardMessage}
        onCancel={() => setToDiscard(null)}
        onConfirm={() => {
          if (toDiscard) discard(toDiscard);
          setToDiscard(null);
        }}
        confirmLabel={t("orders:offline.discard")}
        confirmVariant="destructive"
      />
    </ScreenLayout>
  );
}
