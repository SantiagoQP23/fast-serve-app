import { OrderType } from "@/core/orders/enums/order-type.enum";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { Order } from "@/core/orders/models/order.model";
import { OrderDetailStatus } from "@/core/orders/models/order-detail.model";
import Card from "@/presentation/theme/components/card";
import { labelSolidStyles } from "@/presentation/theme/components/label";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { router } from "expo-router";
import { Text } from "react-native";
import Icon from "@/presentation/theme/components/icon";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { typography } from "@/constants/theme";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useOrderStatus } from "@/presentation/orders/hooks/useOrderStatus";
import {
  ElapsedTimeColor,
  useOrderElapsedTime,
} from "@/presentation/orders/hooks/useOrderElapsedTime";
import { useIsOrderPaneActive } from "@/presentation/orders/context/order-pane.context";
import { useOrderSyncState } from "@/presentation/offline/hooks/useOrderSyncState";

// Two cards share a phone row, so the card shows the first few pending items
// and summarizes the rest instead of growing without bound.
const MAX_VISIBLE_ITEMS = 4;

const elapsedTextColors: Record<ElapsedTimeColor, string> = {
  success: "text-emerald-700",
  warning: "text-orange-700",
  error: "text-red-700",
};

// Ticks every second to track the due time, so it lives in its own component
// and only this line re-renders.
function DeliveryTime({
  deliveryTime,
  urgent,
}: {
  deliveryTime: Date | string;
  urgent: boolean;
}) {
  const { elapsedColor, shouldShow } = useOrderElapsedTime(deliveryTime);

  return (
    <ThemedText
      type="small"
      style={tw`${urgent && shouldShow ? elapsedTextColors[elapsedColor] : "text-gray-500"}`}
    >
      {dayjs(deliveryTime).format("HH:mm")}
    </ThemedText>
  );
}

interface OrderCompactCardProps {
  order: Order;
}

/**
 * Minimal order tile: table (or take away) as the header, a status accent
 * bar with the due time, then only what is still waiting to be delivered.
 */
export default function OrderCompactCard({ order }: OrderCompactCardProps) {
  const { t } = useTranslation(["common", "orders"]);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const { statusText, labelColor } = useOrderStatus(order.status);
  const syncState = useOrderSyncState(order.id);

  const isPaneActive = useIsOrderPaneActive();
  const isSelected = useOrdersStore(
    (state) => isPaneActive && state.activeOrder?.id === order.id,
  );

  const pendingItems = (order.details ?? [])
    .filter((detail) => detail.status !== OrderDetailStatus.CANCELLED)
    .map((detail) => ({
      detail,
      remaining: detail.quantity - detail.qtyDelivered,
    }))
    .filter(({ remaining }) => remaining > 0);
  const visibleItems = pendingItems.slice(0, MAX_VISIBLE_ITEMS);
  const hiddenCount = pendingItems.length - visibleItems.length;

  const isActive =
    order.status !== OrderStatus.DELIVERED &&
    order.status !== OrderStatus.CANCELLED;

  const openOrder = () => {
    setActiveOrder(order);
    // Tablet: the order opens in the detail pane next to the list
    if (isPaneActive) return;
    router.push(`/(order)/${order.num}`);
  };

  return (
    <Card
      onPress={openOrder}
      variant="outline"
      // `grow` (not `flex-1`): content sets the height, and a shorter card
      // stretches to its row neighbour. A zero flex-basis collapsed the card.
      containerStyle={tw`grow rounded-2xl`}
      style={[
        tw`grow p-4 rounded-2xl`,
        isSelected ? tw`bg-secondary` : undefined,
      ]}
    >
      <ThemedView style={tw`flex-row items-center justify-between gap-2`}>
        <ThemedText
          type="h4"
          numberOfLines={1}
          style={[tw`flex-1`, { fontFamily: typography.semibold }]}
        >
          {order.type === OrderType.IN_PLACE
            ? `${t("common:labels.table")} ${order.table?.name}`
            : t("common:labels.takeAway")}
        </ThemedText>
        {syncState && (
          <Icon
            accessibilityLabel={
              syncState === "failed"
                ? t("orders:offline.syncFailed")
                : t("orders:offline.notSynced")
            }
            name={
              syncState === "failed"
                ? "circle-alert"
                : "cloud-upload"
            }
            size={16}
            color={tw.color(
              syncState === "failed" ? "red-500" : "orange-500",
            )}
          />
        )}
      </ThemedView>

      <ThemedView style={tw`flex-row gap-2 mt-2`}>
        <ThemedView
          style={tw`w-[3px] rounded-full ${labelSolidStyles[labelColor ?? "default"].dot}`}
        />
        <ThemedView style={tw`flex-1`}>
          <ThemedText
            type="body2"
            numberOfLines={1}
            style={{ fontFamily: typography.medium }}
          >
            {statusText}
          </ThemedText>
          <DeliveryTime deliveryTime={order.deliveryTime} urgent={isActive} />
        </ThemedView>
      </ThemedView>

      {visibleItems.length > 0 && (
        <ThemedView style={tw`gap-2 mt-3`}>
          {visibleItems.map(({ detail, remaining }) => {
            const isReady = detail.status === OrderDetailStatus.READY;
            const optionName =
              detail.product.options?.length > 1
                ? detail.productOption?.name
                : undefined;

            return (
              <ThemedView key={detail.id} style={tw`flex-row gap-2`}>
                <Icon
                  name={isReady ? "circle-check" : "circle"}
                  size={16}
                  color={tw.color(isReady ? "emerald-600" : "gray-500")}
                  style={tw`mt-[2px]`}
                />
                <ThemedText
                  type="body2"
                  numberOfLines={2}
                  style={[tw`flex-1`, { fontFamily: typography.medium }]}
                >
                  {remaining > 1 && (
                    <Text style={tw`text-gray-500`}>{remaining}× </Text>
                  )}
                  {detail.product.name}
                  {optionName ? ` ${optionName}` : ""}
                </ThemedText>
              </ThemedView>
            );
          })}
          {hiddenCount > 0 && (
            <ThemedText type="small" style={tw`pl-6`}>
              {t("orders:list.moreItems", { count: hiddenCount })}
            </ThemedText>
          )}
        </ThemedView>
      )}
    </Card>
  );
}
