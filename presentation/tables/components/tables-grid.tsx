import { useMemo, useState } from "react";
import { FlatList, View, type FlatListProps } from "react-native";

import TableCard from "@/presentation/home/components/table-card";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { Table } from "@/core/tables/models/table.model";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";
import { useTableGroups } from "@/presentation/tables/hooks/useTableGroups";

const PHONE_NUM_COLUMNS = 4;
const TABLET_MIN_ITEM_WIDTH = 120;
const HORIZONTAL_PADDING = 16;
const COLUMN_GAP = 8;

type GridItem =
  | { type: "header"; key: string; title: string; count: number }
  | { type: "row"; key: string; tables: Table[] };

interface TablesGridProps {
  tables: Table[];
  onTablePress: (table: Table) => void;
  /** Table to mark as the current one (e.g. the table of the order being edited). */
  selectedTableId?: string;
  /** Show only this area's tables, without area headers. */
  areaId?: string | null;
  /** The sheet passes `BottomSheetFlatList` so scrolling cooperates with the sheet. */
  ListComponent?: typeof FlatList;
  contentContainerStyle?: FlatListProps<GridItem>["contentContainerStyle"];
  refreshControl?: FlatListProps<GridItem>["refreshControl"];
}

/**
 * Tables as a grid of `TableCard`s, with an area header per zone when the
 * restaurant has zones. Shared by the tables screen and the table selector sheet.
 */
export default function TablesGrid({
  tables,
  onTablePress,
  selectedTableId,
  areaId = null,
  ListComponent = FlatList,
  contentContainerStyle,
  refreshControl,
}: TablesGridProps) {
  const { t } = useTranslation(["tables"]);
  // Measured, since the grid may sit in a side pane or sheet narrower than the window
  const { width: windowWidth, isTablet, gridColumns } = useResponsiveLayout();
  const [containerWidth, setContainerWidth] = useState(0);
  const gridWidth = (containerWidth || windowWidth) - HORIZONTAL_PADDING * 2;
  const numColumns = isTablet
    ? gridColumns(TABLET_MIN_ITEM_WIDTH, COLUMN_GAP, gridWidth)
    : PHONE_NUM_COLUMNS;
  const itemWidth = (gridWidth - COLUMN_GAP * (numColumns - 1)) / numColumns;

  // Zonas: sin zona elegida, un encabezado por zona (solo si el restaurante tiene zonas).
  const { groups, hasAreas } = useTableGroups(tables);

  const listItems = useMemo(() => {
    const items: GridItem[] = [];
    const shown = areaId
      ? groups.filter((group) => group.area?.id === areaId)
      : groups;
    for (const group of shown) {
      const groupKey = group.area?.id ?? "no-area";
      if (hasAreas && !areaId) {
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
  }, [groups, hasAreas, areaId, numColumns, t]);

  return (
    <ListComponent
      data={listItems}
      keyExtractor={(item: GridItem) => item.key}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      renderItem={({ item }: { item: GridItem }) =>
        item.type === "header" ? (
          <ThemedView
            style={{
              paddingHorizontal: HORIZONTAL_PADDING,
              paddingTop: COLUMN_GAP,
              paddingBottom: COLUMN_GAP,
            }}
          >
            <ThemedText type="h4">{item.title} </ThemedText>
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
                  selected={table.id === selectedTableId}
                  onPress={() => onTablePress(table)}
                />
              </View>
            ))}
          </View>
        )
      }
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    />
  );
}
