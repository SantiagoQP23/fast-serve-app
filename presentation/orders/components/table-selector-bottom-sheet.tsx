import {
  BottomSheetFlatList,
  BottomSheetView,
} from "@expo/ui/community/bottom-sheet";
import { ActivityIndicator, ListRenderItem, Pressable } from "react-native";
import { Order } from "@/core/orders/models/order.model";
import { Table } from "@/core/tables/models/table.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { useOrders } from "../hooks/useOrders";
import { useTables } from "@/presentation/tables/hooks/useTables";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

interface TableSelectorBottomSheetProps {
  order: Order;
  onClose?: () => void;
}

const TableSelectorBottomSheet = ({
  order,
  onClose,
}: TableSelectorBottomSheetProps) => {
  const { t } = useTranslation(["common", "orders", "tables"]);
  const { mutate: updateOrder } = useOrders().updateOrder;
  const { tables, isLoading } = useTables();

  const handleSelectTable = (table: Table) => {
    if (table.id === order.table?.id) {
      onClose?.();
      return;
    }

    updateOrder(
      { id: order.id, tableId: table.id },
      {
        onSuccess: () => {
          onClose?.();
        },
      },
    );
  };

  const renderTable: ListRenderItem<Table> = ({ item: table }) => {
    const isCurrentTable = table.id === order.table?.id;
    return (
      <Pressable
        onPress={() => handleSelectTable(table)}
        style={({ pressed }) => [
          tw.style(
            "flex-row items-center gap-3 p-3 rounded-xl",
            pressed && "bg-gray-100",
          ),
        ]}
      >
        <ThemedView
          style={tw`w-9 h-9 rounded-full bg-light-primary/10 items-center justify-center`}
        >
          <Ionicons
            name="grid-outline"
            size={18}
            color={tw.color("light-primary")}
          />
        </ThemedView>
        <ThemedText type="body1" style={tw`flex-1`}>
          {t("tables:card.table", { name: table.name })}
        </ThemedText>
        {isCurrentTable && (
          <Ionicons
            name="checkmark"
            size={20}
            color={tw.color("light-primary")}
          />
        )}
      </Pressable>
    );
  };

  return (
    <BottomSheetView
      style={tw`px-4 pb-6 bg-light-background dark:bg-dark-background`}
    >
      <ThemedView style={tw`mb-4`}>
        <ThemedText type="h3">{t("orders:newOrder.selectTable")}</ThemedText>
      </ThemedView>

      {isLoading ? (
        <ThemedView style={tw`py-8 items-center`}>
          <ActivityIndicator />
        </ThemedView>
      ) : (
        <BottomSheetFlatList
          data={tables}
          keyExtractor={(item: Table) => item.id}
          contentContainerStyle={tw`gap-1 pb-30`}
          renderItem={renderTable}
        />
      )}
    </BottomSheetView>
  );
};

export default TableSelectorBottomSheet;
