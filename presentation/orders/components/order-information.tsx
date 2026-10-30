import { Pressable } from "react-native";
import dayjs from "dayjs";

import { Order } from "@/core/orders/models/order.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Chip from "@/presentation/theme/components/chip";
import { DetailCard } from "@/presentation/theme/components/detail-card";

interface OrderInformationProps {
  order: Order;
  /** Closed orders show the same chips, read-only. */
  editable: boolean;
  onEditNote: () => void;
  onEditPeople: () => void;
  onEditDeliveryTime: () => void;
  onEditWaiter: () => void;
}

/**
 * The order's delivery time, people and waiter as chips in a card, then its
 * note (same as the cart's). Each one opens its own sheet.
 */
export default function OrderInformation({
  order,
  editable,
  onEditNote,
  onEditPeople,
  onEditDeliveryTime,
  onEditWaiter,
}: OrderInformationProps) {
  const { t } = useTranslation(["common", "menu", "orders"]);
  const notes = order.notes?.trim() ?? "";
  const hasNote = notes !== "";
  const waiter = order.user
    ? `${order.user.person.firstName} ${order.user.person.lastName}`
    : undefined;
  const editHandler = (handler: () => void) => (editable ? handler : undefined);

  return (
    <ThemedView style={tw`gap-2`}>
      {/* Like the product's properties card. Closed orders can't change,
          so their chips are read-only. */}
      <DetailCard style={tw`py-4`}>
        <ThemedView style={tw`flex-row flex-wrap gap-2`}>
          <Chip
            icon="hourglass"
            label={
              order.deliveryTime
                ? dayjs(order.deliveryTime).format("HH:mm")
                : t("orders:newOrder.deliveryStandard")
            }
            onPress={editHandler(onEditDeliveryTime)}
            disabled={!editable}
          />
          <Chip
            icon="users"
            label={String(order.people)}
            onPress={editHandler(onEditPeople)}
            disabled={!editable}
          />
          {waiter && (
            <Chip
              icon="user"
              label={waiter}
              onPress={editHandler(onEditWaiter)}
              disabled={!editable}
            />
          )}
        </ThemedView>
      </DetailCard>

      {/* Same as the cart's note: tap to edit, "Add note..." when empty. */}
      {editable ? (
        <Pressable
          onPress={onEditNote}
          accessibilityRole="button"
          accessibilityLabel={
            hasNote
              ? `${t("menu:product.editNote")}: ${notes}`
              : t("orders:newOrder.addNote")
          }
          style={({ pressed }) => [
            tw`self-start py-3 min-h-12 justify-center`,
            hasNote && tw`self-stretch`,
            pressed && tw`opacity-60`,
          ]}
        >
          <ThemedText
            type="body2"
            numberOfLines={hasNote ? 3 : 1}
            style={!hasNote && tw`text-gray-500`}
          >
            {hasNote ? notes : `${t("orders:newOrder.addNote")}...`}
          </ThemedText>
        </Pressable>
      ) : (
        hasNote && (
          <ThemedText type="body2" style={tw`py-3`}>
            {notes}
          </ThemedText>
        )
      )}
    </ThemedView>
  );
}
