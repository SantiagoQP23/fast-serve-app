import {
  Platform,
  StyleSheet,
  ScrollView,
  Text,
  FlatList,
  Pressable,
} from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";

import TableCard from "@/presentation/home/components/table-card";
import { useCallback, useRef, useState } from "react";
import tw from "@/presentation/theme/lib/tailwind";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import { router } from "expo-router";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { Table } from "@/core/tables/models/table.model";
import { useTables } from "@/presentation/tables/hooks/useTables";

export default function TablesScreen() {
  const [selectedStatus, setSelectedStatus] = useState<boolean | "all">("all");
  const { setTable, setOrderType } = useNewOrderStore();
  const { getTables } = useTables();

  const tabs: { label: string; value: boolean | "all" }[] = [
    { label: "All", value: "all" },
    { label: "Available", value: true },
    { label: "Occupied", value: false },
  ];

  const tables: Table[] = getTables();

  const [filteredTables, setFilteredTables] = useState<Table[]>(getTables());
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handleNavigate = () => {
    bottomSheetModalRef.current?.close(); // Close sheet before navigating
    router.push("/restaurant-menu"); // Navigate to New Order screen
  };

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const onTablePress = (table: Table) => {
    setTable(table);
    setOrderType(OrderType.IN_PLACE);
    handlePresentModalPress();
  };

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  const onChangeStatus = (status: boolean | "all") => {
    setSelectedStatus(status);

    if (status === "all") {
      setFilteredTables(tables);
    } else {
      const filtered = tables.filter((table) => table.isAvailable === status);
      setFilteredTables(filtered);
    }
  };

  return (
    <ThemedView style={tw`px-4 pt-8 flex-1`}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="h1">Tables</ThemedText>
      </ThemedView>
      <ThemedView style={tw`mt-8`} />
      <ThemedView style={tw`flex-row mb-4`}>
        {tabs.map((tab) => {
          const isActive = tab.value === selectedStatus;
          return (
            <Pressable
              key={tab.value.toString()}
              onPress={() => onChangeStatus(tab.value)}
              style={tw`px-4 py-2 mr-2 rounded-full ${
                isActive ? "bg-light-primary" : "bg-gray-200"
              }`}
            >
              <Text
                style={tw`${isActive ? "text-white" : "text-gray-800"} font-medium`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ThemedView>
      <ThemedView style={tw`mt-4`} />
      <FlatList
        data={filteredTables}
        keyExtractor={(item) => item.name.toString()}
        renderItem={(item) => (
          <TableCard
            table={item.item}
            onPress={() => onTablePress(item.item)}
          />
        )}
        numColumns={2} // 2 columns grid
        columnWrapperStyle={tw`justify-between mb-4`}
        contentContainerStyle={tw`pb-20`}
        showsVerticalScrollIndicator={false}
      />

      <BottomSheetModal
        ref={bottomSheetModalRef}
        onChange={handleSheetChanges}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
      >
        <NewOrderBottomSheet onCreateOrder={handleNavigate} />
      </BottomSheetModal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
