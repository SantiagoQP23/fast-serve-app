import { RefreshControl, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
          />
        ))}
        <ThemedView style={tw`h-20`} />
      </ScrollView>
    </ScreenLayout>
  );
}
