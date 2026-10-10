import { Pressable } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
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

interface TicketCardProps {
  ticket: Ticket;
  onReprint: (ticket: Ticket) => void;
  /** Hides the ticket from the unprinted list; shown only when passed. */
  onSkip?: (ticket: Ticket) => void;
  /** When passed, the header shows the order number and table and opens it. */
  order?: Order;
  onOpenOrder?: (order: Order) => void;
}

export default function TicketCard({
  ticket,
  onReprint,
  onSkip,
  order,
  onOpenOrder,
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
    <Card style={tw`p-4 bg-white`}>
      {order && (
        <Pressable
          onPress={() => onOpenOrder?.(order)}
          style={tw`flex-row items-center justify-between pb-3`}
        >
          <ThemedText type="body1" style={{ fontFamily: typography.semibold }}>
            {t("orders:unprintedTickets.orderHeader", {
              num: order.num,
              place: order.table?.name
                ? `${t("orders:details.table")} ${order.table.name}`
                : t("orders:details.takeAway"),
            })}
          </ThemedText>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={tw.color("gray-400")}
          />
        </Pressable>
      )}

      {/* Ticket Header */}
      <ThemedView
        style={tw`flex-row justify-between items-center border-b border-light-border pb-4`}
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
              leftIcon="checkmark-circle"
              color="success"
              size="small"
            />
          )}
          {!ticket.printed && ticket.skipped && (
            <Label
              text={t("orders:tickets.skipped")}
              leftIcon="eye-off-outline"
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
            style={tw`gap-2 bg-white p-3 rounded-3xl`}
          >
            <ThemedText
              type="body2"
              style={[
                tw` text-light-on-surface-variant uppercase`,
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
                      style={tw`font-bold text-light-text min-w-6`}
                    >
                      {item.quantity}x
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={tw`font-semibold text-light-text flex-1`}
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

      <ThemedView style={tw`flex-row gap-2`}>
        {onSkip && (
          <ThemedView style={tw`flex-1`}>
            <Button
              variant="text"
              leftIcon="eye-off-outline"
              label={t("orders:tickets.skip")}
              onPress={() => onSkip(ticket)}
            />
          </ThemedView>
        )}
        <ThemedView style={tw`flex-1`}>
          <Button
            variant={ticket.printed ? "text" : "secondary"}
            leftIcon="print-outline"
            label={
              ticket.printed
                ? t("orders:tickets.reprint")
                : t("orders:tickets.print")
            }
            onPress={() => onReprint(ticket)}
          />
        </ThemedView>
      </ThemedView>
    </Card>
  );
}
