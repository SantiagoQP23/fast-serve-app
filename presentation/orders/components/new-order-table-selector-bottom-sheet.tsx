import {
  BottomSheetFlatList,
  BottomSheetView,
} from "@expo/ui/community/bottom-sheet";
import { ActivityIndicator, ListRenderItem, Pressable } from "react-native";
import { Table } from "@/core/tables/models/table.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { useTables } from "@/presentation/tables/hooks/useTables";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useNewOrderStore } from "../store/newOrderStore";

interface NewOrderTableSelectorBottomSheetProps {
  onClose?: () => void;
}

const NewOrderTableSelectorBottomSheet = ({
  onClose,
}: NewOrderTableSelectorBottomSheetProps) => {
  const { t } = useTranslation(["common", "orders", "tables"]);
  const table = useNewOrderStore((state) => state.table);
  const setTable = useNewOrderStore((state) => state.setTable);
  const { tables, isLoading } = useTables();

  const handleSelectTable = (selected: Table) => {
    setTable(selected);
    onClose?.();
  };

  const renderTable: ListRenderItem<Table> = ({ item }) => {
    const isCurrentTable = item.id === table?.id;
    return (
      <Pressable
        onPress={() => handleSelectTable(item)}
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
          {t("tables:card.table", { name: item.name })}
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
          style={tw`max-h-[60vh]`}
          contentContainerStyle={tw`gap-1 pb-30`}
          renderItem={renderTable}
        />
      )}
    </BottomSheetView>
  );
};

export default NewOrderTableSelectorBottomSheet;
