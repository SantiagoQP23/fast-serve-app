import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { toast } from "sonner-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import TicketCard from "@/presentation/orders/components/ticket-card";
import { useUnprintedTickets } from "@/presentation/orders/hooks/useUnprintedTickets";
import { usePrintComanda } from "@/presentation/orders/hooks/usePrintComanda";
import { useActiveOrders } from "@/presentation/orders/hooks/useActiveOrders";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useUnprintedTicketsStore } from "@/presentation/orders/store/useUnprintedTicketsStore";
import { TicketsService } from "@/core/tickets/services/tickets.service";
import { Ticket } from "@/core/tickets/models/ticket.model";
import { Order } from "@/core/orders/models/order.model";
import IconButton from "@/presentation/theme/components/icon-button";
import Button from "@/presentation/theme/components/button";
import { typography } from "@/constants/theme";

export default function UnprintedTicketsScreen() {
  const { t } = useTranslation(["common", "orders"]);
  const router = useRouter();
  const tickets = useUnprintedTickets();
  const { printComanda } = usePrintComanda();
  const { refetchOrders, isRefetching } = useActiveOrders();
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);

  const openOrder = (order: Order) => {
    setActiveOrder(order);
    router.push(`/(order)/${order.num}`);
  };

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSkippingSelected, setIsSkippingSelected] = useState(false);

  // Tickets printed or skipped elsewhere leave the list, so only count the
  // selected ones that are still visible.
  const selectedTickets = useMemo(
    () =>
      tickets
        .map(({ ticket }) => ticket)
        .filter((ticket) => selectedIds.has(ticket.id)),
    [tickets, selectedIds],
  );
  const allSelected =
    tickets.length > 0 && selectedTickets.length === tickets.length;

  const enterSelectionMode = (ticket: Ticket) => {
    setIsSelectionMode(true);
    setSelectedIds(new Set([ticket.id]));
  };

  const toggleSelect = (ticket: Ticket) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(ticket.id)) {
        next.delete(ticket.id);
      } else {
        next.add(ticket.id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      allSelected ? new Set() : new Set(tickets.map(({ ticket }) => ticket.id)),
    );
  };

  const cancelSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const skipSelected = async () => {
    setIsSkippingSelected(true);
    try {
      const skipped = await TicketsService.skipTickets(
        selectedTickets.map((ticket) => ticket.id),
      );
      const skippedIds = new Set(skipped.map((ticket) => ticket.id));
      const store = useUnprintedTicketsStore.getState();
      selectedTickets
        .filter((ticket) => skippedIds.has(ticket.id))
        .forEach((ticket) => store.applyTicket({ ...ticket, skipped: true }));
      cancelSelectionMode();
    } catch (error) {
      // Nothing was skipped (one transaction), so keep the selection to retry.
      console.error("Error skipping tickets:", error);
      toast.error(
        t("orders:unprintedTickets.skipSelectedError", {
          count: selectedTickets.length,
        }),
      );
    } finally {
      setIsSkippingSelected(false);
    }
  };

  const skipTicket = async (ticket: Ticket) => {
    try {
      await TicketsService.skipTicket(ticket.id);
      useUnprintedTicketsStore
        .getState()
        .applyTicket({ ...ticket, skipped: true });
    } catch (error) {
      console.error("Error skipping ticket:", error);
      toast.error(t("orders:unprintedTickets.skipError"));
    }
  };

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`gap-6 px-4 pt-6 pb-6`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetchOrders()}
          />
        }
      >
        {tickets.length === 0 && (
          <ThemedView style={tw`items-center py-12`}>
            <Ionicons
              name="receipt-outline"
              size={48}
              color={tw.color("gray-400")}
            />
            <ThemedText type="body1" style={tw`text-gray-500 mt-4 text-center`}>
              {t("orders:unprintedTickets.empty")}
            </ThemedText>
          </ThemedView>
        )}

        {tickets.map(({ ticket, order }) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            order={order}
            onOpenOrder={openOrder}
            onReprint={() => printComanda(order, ticket)}
            onSkip={skipTicket}
            onLongPress={enterSelectionMode}
            selectionMode={isSelectionMode}
            selected={selectedIds.has(ticket.id)}
            onToggleSelect={toggleSelect}
          />
        ))}
        <ThemedView style={tw`h-20`} />
      </ScrollView>

      {isSelectionMode && (
        <View style={tw`absolute bottom-6 left-4 right-4 items-center`}>
          <ThemedView
            style={tw`w-full flex-row items-center gap-1 bg-surface rounded-full shadow-sm px-2 py-2`}
          >
            <IconButton
              icon="close"
              variant="text"
              onPress={cancelSelectionMode}
              accessibilityLabel={t("orders:unprintedTickets.cancelSelection")}
            />
            <ThemedText
              type="body1"
              numberOfLines={1}
              style={[tw`flex-1`, { fontFamily: typography.medium }]}
            >
              {t("orders:unprintedTickets.selectedCount", {
                count: selectedTickets.length,
              })}
            </ThemedText>
            <Button
              variant="text"
              size="small"
              label={
                allSelected
                  ? t("orders:unprintedTickets.unselectAll")
                  : t("orders:unprintedTickets.selectAll")
              }
              onPress={toggleSelectAll}
            />
            <Button
              variant="secondary"
              size="small"
              leftIcon="eye-off-outline"
              label={t("orders:tickets.skip")}
              loading={isSkippingSelected}
              disabled={selectedTickets.length === 0 || isSkippingSelected}
              onPress={skipSelected}
            />
          </ThemedView>
        </View>
      )}
    </ScreenLayout>
  );
}
