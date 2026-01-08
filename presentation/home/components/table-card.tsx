import Card from "@/presentation/theme/components/card";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import React from "react";
import { View, Pressable, PressableProps } from "react-native";
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
    <ThemedView style={[tw`w-[48%]`]}>
      <Card
        onPress={onPress}
        style={[
          hasOrders
            ? tw`border border-light-primary bg-gray-100`
            : tw`bg-transparent`,
        ]}
      >
        <ThemedView style={tw`mb-3 flex-row justify-end bg-transparent`}>
          <View
            style={[
              tw`w-3 h-3 rounded-full`,
              !hasOrders ? tw`border border-black-500` : tw`bg-black`,
            ]}
          />
        </ThemedView>
        <ThemedView style={tw`flex-row items-center bg-transparent`}>
          <ThemedText type="h3">
            {t("tables:card.table", { name: table.name })}{" "}
          </ThemedText>
        </ThemedView>
      </Card>
    </ThemedView>
  );
}
