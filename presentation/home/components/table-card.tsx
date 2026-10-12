import Card from "@/presentation/theme/components/card";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import React from "react";
import { View, PressableProps } from "react-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useTableOrders } from "@/presentation/orders/hooks/useTableOrders";
import { Table } from "@/core/tables/models/table.model";

interface TableCardProps extends PressableProps {
  table: Table;
}

export default function TableCard({ table, onPress }: TableCardProps) {
  const { t } = useTranslation(["tables"]);
  const { hasOrders } = useTableOrders(table.id);
  return (
    <ThemedView style={[tw`w-[25%]`]}>
      <Card
        onPress={onPress}
        style={[
          tw`p-2`,
          hasOrders ? tw`border-2 border-light-primary` : tw`bg-transparent`,
        ]}
      >
        <ThemedView
          style={tw`flex-row items-center bg-transparent justify-center`}
        >
          <ThemedText type="body1">{table.name}</ThemedText>
        </ThemedView>
        <ThemedView style={tw` flex-row justify-center bg-transparent mt-2`}>
          <View
            style={[
              tw`w-2 h-2 rounded-full`,
              !hasOrders ? tw`border border-black-500` : tw`bg-light-primary`,
            ]}
          />
        </ThemedView>
      </Card>
    </ThemedView>
  );
}
