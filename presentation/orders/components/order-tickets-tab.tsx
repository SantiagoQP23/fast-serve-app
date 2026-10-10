import { ScrollView } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { usePrintComanda } from "@/presentation/orders/hooks/usePrintComanda";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useTickets } from "@/presentation/orders/hooks/useTickets";
import { Order } from "@/core/orders/models/order.model";
import TicketCard from "@/presentation/orders/components/ticket-card";

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
