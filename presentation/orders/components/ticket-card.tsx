import { Pressable } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import Icon from "@/presentation/theme/components/icon";
import { useProductionAreasStore } from "@/presentation/production-areas/store/useProductionAreasStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { Ticket } from "@/core/tickets/models/ticket.model";
import { TicketType } from "@/core/tickets/enums/ticket-type.enum";
import { TicketItem } from "@/core/tickets/models/ticket-item.model";
import { TicketItemAction } from "@/core/tickets/enums/ticket-item-action.enum";
import { Order } from "@/core/orders/models/order.model";
import dayjs from "dayjs";
import Card from "@/presentation/theme/components/card";
import Button from "@/presentation/theme/components/button";
import Label from "@/presentation/theme/components/label";
import { typography } from "@/constants/theme";
import { orderNumberText } from "@/presentation/offline/local-order";

interface TicketCardProps {
  ticket: Ticket;
  onReprint: (ticket: Ticket) => void;
  /** Hides the ticket from the unprinted list; shown only when passed. */
  onSkip?: (ticket: Ticket) => void;
  /** When passed, the header shows the order number and table and opens it. */
  order?: Order;
  onOpenOrder?: (order: Order) => void;
  /** Long press starts selection; while selecting, a tap toggles the card. */
  onLongPress?: (ticket: Ticket) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (ticket: Ticket) => void;
}

export default function TicketCard({
  ticket,
  onReprint,
  onSkip,
  order,
  onOpenOrder,
  onLongPress,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: TicketCardProps) {
  const { t } = useTranslation(["common", "orders"]);
  const { productionAreas } = useProductionAreasStore();

  const typeLabel =
    ticket.type === TicketType.NEW
      ? t("orders:tickets.typeNew")
      : ticket.type === TicketType.ADD
        ? t("orders:tickets.typeAdd")
        : ticket.type === TicketType.UPDATE
          ? t("orders:tickets.typeUpdate")
          : ticket.type;

  // Group items by production area using denormalized data
  const itemsByArea = ticket.items.reduce(
    (acc, item) => {
      const areaId = item.productionAreaId ?? 0;
      if (!areaId) return acc;

      const area = productionAreas.find((pa) => pa.id === areaId);
      const areaName = area?.name || item.productionAreaName || "Unknown";

      if (!acc[areaId]) {
        acc[areaId] = { areaName, items: [] };
      }
      acc[areaId].items.push(item);
      return acc;
    },
    {} as Record<number, { areaName: string; items: TicketItem[] }>,
  );

  const areaGroups = Object.values(itemsByArea);

  const isUpdate = ticket.type === TicketType.UPDATE;

  const actionLabels: Record<TicketItemAction, string> = {
    [TicketItemAction.ADD]: t("orders:comanda.itemAction.ADD"),
    [TicketItemAction.REMOVE]: t("orders:comanda.itemAction.REMOVE"),
    [TicketItemAction.MODIFY]: t("orders:comanda.itemAction.MODIFY"),
  };

  const actionColors: Record<TicketItemAction, "success" | "error" | "info"> = {
    [TicketItemAction.ADD]: "success",
    [TicketItemAction.REMOVE]: "error",
    [TicketItemAction.MODIFY]: "info",
  };

  return (
    <Card
      disabled={!selectionMode && !onLongPress}
      onPress={() => selectionMode && onToggleSelect?.(ticket)}
      onLongPress={() => !selectionMode && onLongPress?.(ticket)}
      style={tw.style(
        "p-4 bg-surface-bright",
        selected && "border-2 border-primary",
      )}
    >
      {order && (
        <Pressable
          onPress={() =>
            selectionMode ? onToggleSelect?.(ticket) : onOpenOrder?.(order)
          }
          onLongPress={() => !selectionMode && onLongPress?.(ticket)}
          style={tw`flex-row items-center justify-between pb-3`}
        >
          {selectionMode && (
            <Icon
              name={selected ? "circle-check" : "circle"}
              size={22}
              color={selected ? tw.color("primary") : tw.color("gray-400")}
              style={tw`mr-2`}
            />
          )}
          <ThemedText
            type="body1"
            style={[tw`flex-1`, { fontFamily: typography.semibold }]}
          >
            {t("orders:unprintedTickets.orderHeader", {
              order: orderNumberText(order, t),
              place: order.table?.name
                ? `${t("orders:details.table")} ${order.table.name}`
                : t("orders:details.takeAway"),
            })}
          </ThemedText>
          {!selectionMode && (
            <Icon name="chevron-right" size={18} color={tw.color("gray-400")} />
          )}
        </Pressable>
      )}

      {/* Ticket Header */}
      <ThemedView
        style={tw`flex-row justify-between items-center border-b border-border pb-4`}
      >
        <ThemedView style={tw`flex-row items-center gap-2`}>
          <Label text={typeLabel} />
        </ThemedView>

        <ThemedView style={tw`flex-row items-center gap-2`}>
          <ThemedText type="caption" style={tw`text-gray-500`}>
            {dayjs(ticket.createdAt).format("HH:mm")}
          </ThemedText>
          {ticket.printed && (
            <Label
              text={t("orders:tickets.printed")}
              leftIcon="circle-check"
              color="success"
              size="small"
            />
          )}
          {!ticket.printed && ticket.skipped && (
            <Label
              text={t("orders:tickets.skipped")}
              leftIcon="eye-off"
              size="small"
            />
          )}
        </ThemedView>
      </ThemedView>

      {/* Items by area */}
      <ThemedView style={tw`py-4 gap-4`}>
        {areaGroups.map((group) => (
          <ThemedView
            key={group.areaName}
            style={tw`gap-2 bg-surface-bright p-3 rounded-3xl`}
          >
            <ThemedText
              type="body2"
              style={[
                tw` text-on-surface-variant uppercase`,
                { fontFamily: typography.semibold },
              ]}
            >
              {group.areaName}
            </ThemedText>
            <ThemedView style={tw`gap-2`}>
              {group.items.map((item, idx) => (
                <ThemedView key={`${item.id}-${idx}`} style={tw`gap-1`}>
                  <ThemedView style={tw`flex-row items-start gap-2`}>
                    <ThemedText
                      type="small"
                      style={tw`font-bold text-text min-w-6`}
                    >
                      {item.quantity}x
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={tw`font-semibold text-text flex-1`}
                    >
                      {item.productName}
                    </ThemedText>
                    {isUpdate && (
                      <Label
                        text={actionLabels[item.action]}
                        color={actionColors[item.action]}
                        size="small"
                      />
                    )}
                  </ThemedView>

                  {item.productOptionName && (
                    <ThemedText type="small" style={tw`text-gray-500 ml-8`}>
                      {item.productOptionName}
                    </ThemedText>
                  )}

                  {item.tagsSnapshot && (
                    <ThemedText type="small" style={tw`text-gray-500 ml-8`}>
                      + {item.tagsSnapshot}
                    </ThemedText>
                  )}

                  {item.description && (
                    <ThemedText
                      type="small"
                      style={tw`text-gray-500 ml-8 italic`}
                    >
                      *** {item.description} ***
                    </ThemedText>
                  )}
                </ThemedView>
              ))}
            </ThemedView>
          </ThemedView>
        ))}
      </ThemedView>

      {!selectionMode && (
        <ThemedView style={tw`flex-row gap-2`}>
          {onSkip && (
            <ThemedView style={tw`flex-1`}>
              <Button
                variant="text"
                leftIcon="eye-off"
                label={t("orders:tickets.skip")}
                onPress={() => onSkip(ticket)}
                size="small"
              />
            </ThemedView>
          )}
          <ThemedView style={tw`flex-1`}>
            <Button
              variant={ticket.printed ? "text" : "secondary"}
              leftIcon="printer"
              label={
                ticket.printed
                  ? t("orders:tickets.reprint")
                  : t("orders:tickets.print")
              }
              onPress={() => onReprint(ticket)}
              size="small"
            />
          </ThemedView>
        </ThemedView>
      )}
    </Card>
  );
}
