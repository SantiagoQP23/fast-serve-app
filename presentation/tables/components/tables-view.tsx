import { RefreshControl } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";

import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import tw from "@/presentation/theme/lib/tailwind";
import { useTables } from "@/presentation/tables/hooks/useTables";
import Chip from "@/presentation/theme/components/chip";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { syncQueryKey } from "@/presentation/sync/hooks/useSync";
import { useQueryClient } from "@tanstack/react-query";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import Icon from "@/presentation/theme/components/icon";
import Button from "@/presentation/theme/components/button";
import { useTableByStatus } from "@/presentation/orders/hooks/useTableByStatus";
import { Table } from "@/core/tables/models/table.model";
import { ViewStyle } from "react-native";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import TablesGrid from "@/presentation/tables/components/tables-grid";

interface TablesViewProps {
  onTablePress: (table: Table) => void;
  style?: ViewStyle;
  /** Rendered after the last table. */
  footer?: ReactElement;
}

export default function TablesView({
  onTablePress,
  style,
  footer,
}: TablesViewProps) {
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
        // Orders and tables come from the sync query.
        queryClient.refetchQueries({
          queryKey: syncQueryKey(currentRestaurant?.id),
        }),
      ]);
    } catch (error) {
      // Silent refresh error
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, currentRestaurant?.id]);

  const hasTables = tables.length > 0;

  // Zonas: la zona elegida se recuerda en el teléfono y el grid muestra solo esa.
  const areas = useTablesStore((state) => state.areas);
  const storedAreaId = useTablesStore((state) => state.selectedAreaId);
  const visibleAreas = useMemo(
    () =>
      areas.filter((area) => area.isActive).sort((a, b) => a.order - b.order),
    [areas],
  );
  const selectedAreaId = visibleAreas.some((a) => a.id === storedAreaId)
    ? storedAreaId
    : null;

  if (!hasTables) {
    return (
      <ThemedView
        style={tw.style(
          `flex-1 px-4 pt-8 items-center justify-center gap-4`,
          style,
        )}
      >
        <Icon name="layout-grid" size={64} color={tw.color("gray-400")} />
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
          leftIcon="cloud-download"
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
    <ThemedView style={tw.style(`flex-1`, style)}>
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
      {/* {hasAreas && ( */}
      {/*   <ScrollView */}
      {/*     horizontal */}
      {/*     showsHorizontalScrollIndicator={false} */}
      {/*     style={tw`grow-0`} */}
      {/*     contentContainerStyle={tw`gap-2 px-4 pt-4`} */}
      {/*   > */}
      {/*     <Chip */}
      {/*       label={t("tables:areas.all")} */}
      {/*       selected={!selectedAreaId} */}
      {/*       onPress={() => setSelectedAreaId(null)} */}
      {/*     /> */}
      {/*     {visibleAreas.map((area) => ( */}
      {/*       <Chip */}
      {/*         key={area.id} */}
      {/*         label={area.name} */}
      {/*         selected={selectedAreaId === area.id} */}
      {/*         onPress={() => setSelectedAreaId(area.id)} */}
      {/*       /> */}
      {/*     ))} */}
      {/*   </ScrollView> */}
      {/* )} */}
      <TablesGrid
        tables={filteredTables}
        areaId={selectedAreaId}
        onTablePress={onTablePress}
        // Short grids push the footer down to the bottom, clear of the FAB
        contentContainerStyle={tw.style(`pb-20 pt-4`, footer && `grow`)}
        ListFooterComponent={footer}
        ListFooterComponentStyle={tw`mt-auto`}
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
