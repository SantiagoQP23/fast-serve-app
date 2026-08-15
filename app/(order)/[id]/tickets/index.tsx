import React from "react";
import { ScrollView, View, Pressable } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { usePrintComanda } from "@/presentation/orders/hooks/usePrintComanda";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { Ionicons } from "@expo/vector-icons";
import { useProductionAreasStore } from "@/presentation/production-areas/store/useProductionAreasStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useTickets } from "@/presentation/orders/hooks/useTickets";
import { Ticket } from "@/core/tickets/models/ticket.model";
import { TicketType } from "@/core/tickets/enums/ticket-type.enum";
import { TicketItem } from "@/core/tickets/models/ticket-item.model";
import dayjs from "dayjs";
import IconButton from "@/presentation/theme/components/icon-button";
import Card from "@/presentation/theme/components/card";
import Button from "@/presentation/theme/components/button";

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

  const typeColor =
    ticket.type === TicketType.NEW
      ? "bg-green-100 text-green-700"
      : ticket.type === TicketType.ADD
        ? "bg-blue-100 text-blue-700"
        : "bg-gray-100 text-gray-700";

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
    <Card
      style={tw`bg-white rounded-2xl border border-gray-200 overflow-hidden`}
    >
      {/* Ticket Header */}
      <ThemedView
        style={tw`flex-row justify-between items-center border-b border-gray-100 pb-4`}
      >
        <ThemedView style={tw`flex-row items-center gap-2`}>
          <ThemedView
            style={tw`px-2 py-1 rounded-full ${typeColor.split(" ")[0]}`}
          >
            <ThemedText
              type="small"
              style={tw`font-bold ${typeColor.split(" ")[1]}`}
            >
              {typeLabel}
            </ThemedText>
          </ThemedView>
          <ThemedText type="caption" style={tw`text-gray-500`}>
            {dayjs(ticket.createdAt).format("HH:mm")}
          </ThemedText>
        </ThemedView>

        <ThemedView style={tw`flex-row items-center gap-2`}>
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
      <ThemedView style={tw`p-4 gap-4`}>
        {areaGroups.map((group) => (
          <ThemedView key={group.areaName} style={tw`gap-2`}>
            <ThemedText
              type="body2"
              style={tw`font-bold text-light-primary uppercase`}
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

export default function OrderTicketsScreen() {
  const { t } = useTranslation(["common", "orders"]);
  const order = useOrdersStore((state) => state.activeOrder);
  const { printComanda } = usePrintComanda();

  const { tickets, isLoading } = useTickets(order?.id || null);

  if (!order) {
    return (
      <ScreenLayout style={tw`flex-1 justify-center items-center`}>
        <ThemedText type="h2">{t("orders:details.noActiveOrder")}</ThemedText>
      </ScreenLayout>
    );
  }

  return (
    <View style={tw`flex-1`}>
      <ScreenLayout style={tw`flex-1`}>
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`px-4 pt-6 pb-6 gap-6`}
          showsVerticalScrollIndicator={false}
        >
          {/* Order Summary Header */}
          <ThemedView style={tw`gap-1 mb-2 items-center `}>
            <ThemedText type="caption" style={tw`text-gray-500`}>
              {t("orders:details.orderNumber", { num: order.num })}
            </ThemedText>
            <ThemedText type="h2" style={tw`font-bold`}>
              {order.table
                ? t("orders:comanda.table", { name: order.table.name })
                : t("orders:comanda.takeAway")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {tickets.length}{" "}
              {tickets.length === 1
                ? t("orders:tickets.ticketSingular")
                : t("orders:tickets.ticketPlural")}
            </ThemedText>
          </ThemedView>

          {tickets.length === 0 && !isLoading && (
            <ThemedView style={tw`items-center py-12`}>
              <Ionicons
                name="receipt-outline"
                size={48}
                color={tw.color("gray-400")}
              />
              <ThemedText
                type="body1"
                style={tw`text-gray-500 mt-4 text-center`}
              >
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
        </ScrollView>
      </ScreenLayout>
    </View>
  );
}
