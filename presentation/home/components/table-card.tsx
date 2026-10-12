import Card from "@/presentation/theme/components/card";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import React from "react";
import { View, PressableProps } from "react-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useTableOrders } from "@/presentation/orders/hooks/useTableOrders";
import { Table } from "@/core/tables/models/table.model";
import { Order } from "@/core/orders/models/order.model";
import { useOrderStatus } from "@/presentation/orders/hooks/useOrderStatus";
import { labelSolidStyles } from "@/presentation/theme/components/label";

interface TableCardProps extends PressableProps {
  table: Table;
}

function OrderStatusDot({ order }: { order: Order }) {
  const { labelColor = "default" } = useOrderStatus(order.status);
  return (
    <View
      style={tw`w-2 h-2 rounded-full ${labelSolidStyles[labelColor].dot}`}
    />
  );
}

export default function TableCard({ table, onPress }: TableCardProps) {
  const { t } = useTranslation(["tables"]);
  const { hasOrders, tableOrders } = useTableOrders(table.id);
  return (
    <ThemedView style={[tw`w-full`]}>
      <Card
        onPress={onPress}
        style={[
          tw`p-2 `,
          hasOrders ? tw`border border-light-primary` : tw`bg-transparent`,
        ]}
        variant={hasOrders ? "default" : "outline"}
      >
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
          ) : (
            <View style={tw`w-2 h-2 rounded-full bg-transparent`} />
          )}
        </ThemedView>
      </Card>
    </ThemedView>
  );
}
