import Card from "@/presentation/theme/components/card";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import React from "react";
import { View, PressableProps } from "react-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useTableOrders } from "@/presentation/orders/hooks/useTableOrders";
import { useTableStatus } from "@/presentation/tables/hooks/useTableStatus";
import { Table } from "@/core/tables/models/table.model";
import { Order } from "@/core/orders/models/order.model";
import { useOrderStatus } from "@/presentation/orders/hooks/useOrderStatus";
import { labelSolidStyles } from "@/presentation/theme/components/label";

interface TableCardProps extends PressableProps {
  table: Table;
  /** Marks the table as the current choice (e.g. in the table selector). */
  selected?: boolean;
}

function OrderStatusDot({ order }: { order: Order }) {
  const { labelColor = "default" } = useOrderStatus(order.status);
  return (
    <View
      style={tw`w-2 h-2 rounded-full ${labelSolidStyles[labelColor].dot}`}
    />
  );
}

export default function TableCard({
  table,
  onPress,
  selected = false,
}: TableCardProps) {
  const { t } = useTranslation(["common", "tables"]);
  const { hasOrders, tableOrders } = useTableOrders(table.id);
  const { isOccupied } = useTableStatus(table.id);
  const statusText = isOccupied
    ? t("common:status.occupied")
    : t("common:status.available");
  return (
    <ThemedView style={[tw`w-full`]}>
      {/* The dots only show the current waiter's orders, so an occupied table
          with none (marked by hand, or with another waiter's orders) shows an
          outlined dot to tell it apart from a free one. */}
      <Card
        onPress={onPress}
        accessibilityLabel={`${t("tables:details.table", { name: table.name })}, ${statusText}`}
        style={tw`p-2 rounded-lg`}
        containerStyle={[
          tw`rounded-lg`,
          isOccupied && tw` bg-surface-container-low`,
        ]}
        variant="outline"
      >
        {/* Overlay instead of a border so selecting doesn't change the card size */}
        {selected && (
          <View
            pointerEvents="none"
            style={tw`absolute inset-0 rounded-lg border-2 border-primary`}
          />
        )}
        <ThemedView
          style={tw`flex-row items-center bg-transparent justify-center`}
        >
          <ThemedText type="body1">{table.name}</ThemedText>
        </ThemedView>
        <ThemedView
          style={tw`flex-row flex-wrap justify-center gap-1 bg-transparent mt-2`}
        >
          {hasOrders ? (
            tableOrders.map((order) => (
              <OrderStatusDot key={order.id} order={order} />
            ))
          ) : isOccupied ? (
            // Explicit radius: `rounded-full` isn't clamped on Android once a
            // border is added, so the ring would render square
            <View
              style={[
                tw`w-2 h-2 border-on-surface`,
                { borderRadius: 4, borderWidth: 1.5 },
              ]}
            />
          ) : (
            <View style={tw`w-2 h-2 rounded-full bg-transparent`} />
          )}
        </ThemedView>
      </Card>
    </ThemedView>
  );
}
