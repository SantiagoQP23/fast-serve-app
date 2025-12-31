import {
  Platform,
  StyleSheet,
  ScrollView,
  Text,
  FlatList,
  Pressable,
  View,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";

import TableCard from "@/presentation/home/components/table-card";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import tw from "@/presentation/theme/lib/tailwind";
import * as Haptics from "expo-haptics";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import { router } from "expo-router";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { Table } from "@/core/tables/models/table.model";
import { useTables } from "@/presentation/tables/hooks/useTables";
import Chip from "@/presentation/theme/components/chip";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useQueryClient } from "@tanstack/react-query";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

export default function TablesScreen() {
  const { t } = useTranslation(["tables", "errors"]);
  const [selectedStatus, setSelectedStatus] = useState<boolean | "all">("all");
  const { setTable, setOrderType } = useNewOrderStore();
  const { tables, isLoading } = useTables();
  const orders = useOrdersStore((state) => state.orders);
  const [activeTable, setActiveTable] = useState<Table | null>(null);
  const queryClient = useQueryClient();
  const { currentRestaurant } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const primaryColor = useThemeColor({}, "primary");

  const tabs: { label: string; value: boolean | "all" }[] = [
    { label: t("list.filter.all"), value: "all" },
    { label: t("list.filter.available"), value: true },
    { label: t("list.filter.occupied"), value: false },
  ];

  const [filteredTables, setFilteredTables] = useState<Table[]>(tables);
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
    // Check if table has any orders
    const tableHasOrders = orders.some((order) => order.table?.id === table.id);

    if (tableHasOrders) {
      // Navigate to table orders screen
      router.push({
        pathname: "/(tables)/[tableId]",
        params: { tableId: table.id, tableName: table.name },
      });
    } else {
      // Show new order bottom sheet
      setActiveTable(table);
      setTable(table);
      setOrderType(OrderType.IN_PLACE);
      handlePresentModalPress();
    }
  };

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      // Trigger haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Refetch tables using the centralized query
      await queryClient.refetchQueries({
        queryKey: ["tables", currentRestaurant?.id],
      });
    } catch {
      Alert.alert(
        t("errors:table.fetchError"),
        t("errors:table.tablesFetchFailed"),
      );
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, currentRestaurant?.id, t]);

  const onChangeStatus = (status: boolean | "all") => {
    setSelectedStatus(status);

    if (status === "all") {
      setFilteredTables(tables);
    } else {
      const filtered = tables.filter((table) => table.isAvailable === status);
      setFilteredTables(filtered);
    }
  };

  useEffect(() => {
    setFilteredTables(tables);
  }, [tables]);

  // Show loading indicator on initial load
  if (isLoading && tables.length === 0) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color={primaryColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={tw`px-4 pt-8 flex-1`}>
      <ThemedText type="h1">{t("list.title")}</ThemedText>
      <ThemedView style={tw`mt-8`} />
      <ThemedView style={tw`flex-row mb-4 gap-2`}>
        {tabs.map((tab) => {
          const isActive = tab.value === selectedStatus;
          return (
            <Chip
              key={tab.value.toString()}
              onPress={() => onChangeStatus(tab.value)}
              selected={isActive}
              label={tab.label}
            />
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
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
