import { ScrollView } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { usePrintComanda } from "@/presentation/orders/hooks/usePrintComanda";
import { Ionicons } from "@expo/vector-icons";
import { useProductionAreasStore } from "@/presentation/production-areas/store/useProductionAreasStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useTickets } from "@/presentation/orders/hooks/useTickets";
import { Ticket } from "@/core/tickets/models/ticket.model";
import { TicketType } from "@/core/tickets/enums/ticket-type.enum";
import { TicketItem } from "@/core/tickets/models/ticket-item.model";
import { Order } from "@/core/orders/models/order.model";
import dayjs from "dayjs";
import Card from "@/presentation/theme/components/card";
import Button from "@/presentation/theme/components/button";
import Label from "@/presentation/theme/components/label";

function TicketCard({
  ticket,
  onReprint,
}: {
  ticket: Ticket;
  onReprint: (ticket: Ticket) => void;
}) {
  const { t } = useTranslation(["common", "orders"]);
  const { productionAreas } = useProductionAreasStore();

  const typeLabel =
    ticket.type === TicketType.NEW
      ? t("orders:tickets.typeNew")
      : ticket.type === TicketType.ADD
        ? t("orders:tickets.typeAdd")
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

  return (
    <Card style={tw``}>
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
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={tw.color("green-500")}
            />
          )}
        </ThemedView>
      </ThemedView>

      {/* Items by area */}
      <ThemedView style={tw`py-4 gap-4`}>
        {areaGroups.map((group) => (
          <ThemedView key={group.areaName} style={tw`gap-2`}>
            <ThemedText
              type="body1"
              style={tw`font-bold text-light-on-surface-variant uppercase`}
            >
              {group.areaName}
            </ThemedText>
            <ThemedView style={tw`gap-2`}>
              {group.items.map((item, idx) => (
                <ThemedView key={`${item.id}-${idx}`} style={tw`gap-1`}>
                  <ThemedView style={tw`flex-row items-start gap-2`}>
                    <ThemedText
                      type="body1"
                      style={tw`font-bold text-light-text min-w-6`}
                    >
                      {item.quantity}x
                    </ThemedText>
                    <ThemedText
                      type="body1"
                      style={tw`font-semibold text-light-text flex-1`}
                    >
                      {item.productName}
                    </ThemedText>
                  </ThemedView>

                  {item.productOptionName && (
                    <ThemedText type="body2" style={tw`text-gray-500 ml-8`}>
                      {item.productOptionName}
                    </ThemedText>
                  )}

                  {item.tagsSnapshot && (
                    <ThemedText type="body2" style={tw`text-gray-500 ml-8`}>
                      + {item.tagsSnapshot}
                    </ThemedText>
                  )}

                  {item.description && (
                    <ThemedText
                      type="body2"
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

      <Button
        variant="text"
        leftIcon="print-outline"
        label={t("orders:tickets.reprint")}
        onPress={() => onReprint(ticket)}
      />
    </Card>
  );
}

interface OrderTicketsTabProps {
  order: Order;
}

export default function OrderTicketsTab({ order }: OrderTicketsTabProps) {
  const { t } = useTranslation(["common", "orders"]);
  const { printComanda } = usePrintComanda();

  const { tickets, isLoading } = useTickets(order.id);

  return (
    <ScrollView
      style={tw`flex-1`}
      contentContainerStyle={tw`gap-6`}
      showsVerticalScrollIndicator={false}
    >
      {tickets.length === 0 && !isLoading && (
        <ThemedView style={tw`items-center py-12`}>
          <Ionicons
            name="receipt-outline"
            size={48}
            color={tw.color("gray-400")}
          />
          <ThemedText type="body1" style={tw`text-gray-500 mt-4 text-center`}>
            {t("orders:tickets.noTickets")}
          </ThemedText>
        </ThemedView>
      )}

      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          onReprint={() => printComanda(order, ticket)}
        />
      ))}
      <ThemedView style={tw`h-20`} />
    </ScrollView>
  );
}
