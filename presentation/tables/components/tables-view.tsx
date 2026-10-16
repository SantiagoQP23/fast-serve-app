import { FlatList, RefreshControl, ScrollView, View } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";

import TableCard from "@/presentation/home/components/table-card";
import { useCallback, useEffect, useMemo, useState } from "react";
import tw from "@/presentation/theme/lib/tailwind";
import { useTables } from "@/presentation/tables/hooks/useTables";
import Chip from "@/presentation/theme/components/chip";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useQueryClient } from "@tanstack/react-query";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/presentation/theme/components/button";
import { useTableByStatus } from "@/presentation/orders/hooks/useTableByStatus";
import { Table } from "@/core/tables/models/table.model";
import { ViewStyle } from "react-native";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";
import { useTableGroups } from "@/presentation/tables/hooks/useTableGroups";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";

const PHONE_NUM_COLUMNS = 4;
const TABLET_MIN_ITEM_WIDTH = 120;
const HORIZONTAL_PADDING = 16;
const COLUMN_GAP = 8;

interface TablesViewProps {
  onTablePress: (table: Table) => void;
  style?: ViewStyle;
}

export default function TablesView({ onTablePress, style }: TablesViewProps) {
  const { t } = useTranslation(["tables", "errors"]);
  const [selectedStatus, setSelectedStatus] = useState<boolean | "all">("all");
  const { tables: allTables, isLoading, tablesQuery } = useTables();
  const tables = useMemo(
    () => allTables.filter((table) => table.isActive !== false),
    [allTables],
  );
  const { availableTables, occupiedTables } = useTableByStatus(tables);
  const queryClient = useQueryClient();
  const { currentRestaurant } = useAuthStore();
  const primaryColor = useThemeColor({}, "primary");
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Measured, since the grid may sit in a side pane narrower than the window
  const { width: windowWidth, isTablet, gridColumns } = useResponsiveLayout();
  const [containerWidth, setContainerWidth] = useState(0);
  const gridWidth = (containerWidth || windowWidth) - HORIZONTAL_PADDING * 2;
  const numColumns = isTablet
    ? gridColumns(TABLET_MIN_ITEM_WIDTH, COLUMN_GAP, gridWidth)
    : PHONE_NUM_COLUMNS;
  const itemWidth = (gridWidth - COLUMN_GAP * (numColumns - 1)) / numColumns;

  const tabs: { label: string; value: boolean | "all"; count: number }[] = [
    { label: t("list.filter.all"), value: "all", count: tables.length },
    {
      label: t("list.filter.available"),
      value: true,
      count: availableTables.length,
    },
    {
      label: t("list.filter.occupied"),
      value: false,
      count: occupiedTables.length,
    },
  ];

  const [filteredTables, setFilteredTables] = useState<Table[]>(tables);

  const handleLoadTables = async () => {
    setIsLoadingTables(true);
    try {
      await tablesQuery.refetch();
    } catch (error) {
      // Error is handled by React Query
    } finally {
      setIsLoadingTables(false);
    }
  };

  const onChangeStatus = (status: boolean | "all") => {
    setSelectedStatus(status);

    if (status === "all") {
      setFilteredTables(tables);
    } else if (status) {
      setFilteredTables(availableTables);
    } else {
      setFilteredTables(occupiedTables);
    }
  };

  useEffect(() => {
    setFilteredTables(tables);
  }, [tables]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["activeOrders", currentRestaurant?.id],
        }),
      ]);
    } catch (error) {
      // Silent refresh error
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, currentRestaurant?.id]);

  const hasTables = tables.length > 0;

  // Zonas: chips arriba (solo si el restaurante tiene zonas) y, con "Todas",
  // un encabezado por zona. La zona elegida se recuerda en el teléfono.
  const { groups, hasAreas, areas } = useTableGroups(filteredTables);
  const storedAreaId = useTablesStore((state) => state.selectedAreaId);
  const setSelectedAreaId = useTablesStore((state) => state.setSelectedAreaId);
  const visibleAreas = useMemo(
    () =>
      areas.filter((area) => area.isActive).sort((a, b) => a.order - b.order),
    [areas],
  );
  const selectedAreaId = visibleAreas.some((a) => a.id === storedAreaId)
    ? storedAreaId
    : null;

  const listItems = useMemo(() => {
    const items: (
      | { type: "header"; key: string; title: string; count: number }
      | { type: "row"; key: string; tables: Table[] }
    )[] = [];
    const shown = selectedAreaId
      ? groups.filter((group) => group.area?.id === selectedAreaId)
      : groups;
    for (const group of shown) {
      const groupKey = group.area?.id ?? "no-area";
      if (hasAreas && !selectedAreaId) {
        items.push({
          type: "header",
          key: `header-${groupKey}`,
          title: group.area?.name ?? t("tables:areas.noArea"),
          count: group.tables.length,
        });
      }
      for (let i = 0; i < group.tables.length; i += numColumns) {
        items.push({
          type: "row",
          key: `row-${groupKey}-${i}`,
          tables: group.tables.slice(i, i + numColumns),
        });
      }
    }
    return items;
  }, [groups, hasAreas, selectedAreaId, numColumns, t]);

  if (!hasTables) {
    return (
      <ThemedView
        style={tw.style(
          `flex-1 px-4 pt-8 items-center justify-center gap-4`,
          style,
        )}
      >
        <Ionicons name="grid-outline" size={64} color="#999" />
        <ThemedView style={tw`gap-2 items-center`}>
          <ThemedText type="h2">{t("tables:noTables.title")}</ThemedText>
          <ThemedText type="body2" style={tw`text-center text-gray-500 px-8`}>
            {t("tables:noTables.description")}
          </ThemedText>
        </ThemedView>
        <Button
          label={
            tablesQuery.isError
              ? t("tables:noTables.retry")
              : isLoadingTables
                ? t("tables:noTables.loading")
                : t("tables:noTables.loadButton")
          }
          leftIcon="cloud-download-outline"
          onPress={handleLoadTables}
          disabled={isLoadingTables}
          loading={isLoadingTables}
        />
        {tablesQuery.isError && (
          <ThemedText type="body2" style={tw`text-red-500 text-center px-8`}>
            {t("tables:noTables.error")}
          </ThemedText>
        )}
      </ThemedView>
    );
  }

  return (
    <ThemedView
      style={tw.style(`flex-1`, style)}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* <ThemedView style={tw`flex-row mb-4 gap-2 px-4 pt-4`}> */}
      {/*   {tabs.map((tab) => { */}
      {/*     const isActive = tab.value === selectedStatus; */}
      {/*     return ( */}
      {/*       <Chip */}
      {/*         key={tab.value.toString()} */}
      {/*         onPress={() => onChangeStatus(tab.value)} */}
      {/*         selected={isActive} */}
      {/*         label={tab.label} */}
      {/*         rightContent={ */}
      {/*           <ThemedText */}
      {/*             type="small" */}
      {/*             style={tw`${isActive ? "text-on-secondary" : ""}`} */}
      {/*           > */}
      {/*             {tab.count} */}
      {/*           </ThemedText> */}
      {/*         } */}
      {/*       /> */}
      {/*     ); */}
      {/*   })} */}
      {/* </ThemedView> */}
      {hasAreas && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={tw`grow-0`}
          contentContainerStyle={tw`gap-2 px-4 pt-4`}
        >
          <Chip
            label={t("tables:areas.all")}
            selected={!selectedAreaId}
            onPress={() => setSelectedAreaId(null)}
          />
          {visibleAreas.map((area) => (
            <Chip
              key={area.id}
              label={area.name}
              selected={selectedAreaId === area.id}
              onPress={() => setSelectedAreaId(area.id)}
            />
          ))}
        </ScrollView>
      )}
      <FlatList
        data={listItems}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) =>
          item.type === "header" ? (
            <ThemedView
              style={{
                paddingHorizontal: HORIZONTAL_PADDING,
                paddingTop: COLUMN_GAP,
                paddingBottom: COLUMN_GAP,
              }}
            >
              <ThemedText type="h4">
                {item.title}{" "}
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {t("tables:areas.tablesCount", { count: item.count })}
                </ThemedText>
              </ThemedText>
            </ThemedView>
          ) : (
            <View
              style={{
                flexDirection: "row",
                gap: COLUMN_GAP,
                marginBottom: COLUMN_GAP,
                paddingHorizontal: HORIZONTAL_PADDING,
              }}
            >
              {item.tables.map((table) => (
                <View key={table.id} style={{ width: itemWidth }}>
                  <TableCard
                    table={table}
                    onPress={() => onTablePress(table)}
                  />
                </View>
              ))}
            </View>
          )
        }
        contentContainerStyle={tw`pb-20 pt-4`}
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
    </ThemedView>
  );
}
