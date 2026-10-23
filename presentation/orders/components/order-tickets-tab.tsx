import { ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { useCallback, useState } from "react";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { usePrintComanda } from "@/presentation/orders/hooks/usePrintComanda";
import Icon from "@/presentation/theme/components/icon";
import Button from "@/presentation/theme/components/button";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useTickets } from "@/presentation/orders/hooks/useTickets";
import { Order } from "@/core/orders/models/order.model";
import TicketCard from "@/presentation/orders/components/ticket-card";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";

interface OrderTicketsTabProps {
  order: Order;
}

export default function OrderTicketsTab({ order }: OrderTicketsTabProps) {
  const { t } = useTranslation(["common", "orders", "bills"]);
  const { printComanda } = usePrintComanda();
  const primaryColor = useThemeColor({}, "primary");
  const [refreshing, setRefreshing] = useState(false);

  const { tickets, isLoading, isError, refetch } = useTickets(order.id);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await refetch();
      if (result.isError) toast.error(t("orders:tickets.loadError"));
    } finally {
      setRefreshing(false);
    }
  }, [refetch, t]);

  if (isLoading) {
    return (
      <ThemedView style={tw`flex-1 items-center pt-12`}>
        <ActivityIndicator color={primaryColor} />
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={tw`flex-1`}
      contentContainerStyle={tw`gap-6 pt-4 pb-6 grow`}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={primaryColor}
          colors={[primaryColor]}
        />
      }
    >
      {isError && tickets.length === 0 ? (
        <ThemedView style={tw`items-center gap-4 pt-12 px-8`}>
          <Icon name="wifi-off" size={40} color={tw.color("gray-500")} />
          <ThemedView style={tw`items-center gap-1`}>
            <ThemedText type="h4" style={tw`text-center`}>
              {t("orders:tickets.loadError")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
              {t("bills:loadState.errorDescription")}
            </ThemedText>
          </ThemedView>
          <Button
            label={t("bills:loadState.retry")}
            leftIcon="refresh-cw"
            variant="outline"
            size="small"
            onPress={() => refetch()}
          />
        </ThemedView>
      ) : tickets.length === 0 ? (
        <ThemedView style={tw`items-center gap-3 pt-12 px-8`}>
          <Icon name="receipt-text" size={40} color={tw.color("gray-500")} />
          <ThemedText type="body1" style={tw`text-gray-500 text-center`}>
            {t("orders:tickets.noTickets")}
          </ThemedText>
        </ThemedView>
      ) : (
        tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onReprint={() => printComanda(order, ticket)}
          />
        ))
      )}
    </ScrollView>
  );
}
