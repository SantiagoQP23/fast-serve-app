import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { router, useNavigation } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { type BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useTables } from "@/presentation/tables/hooks/useTables";
import { useTablesManagement } from "@/presentation/tables/hooks/useTablesManagement";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Roles, isValidRole } from "@/core/auth/models/user.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import Label from "@/presentation/theme/components/label";
import type { Table } from "@/core/tables/models/table.model";
import IconButton from "@/presentation/theme/components/icon-button";
import { typography } from "@/constants/theme";
import {
  sortAreas,
  useTableGroups,
} from "@/presentation/tables/hooks/useTableGroups";
import { useTableAreasManagement } from "@/presentation/tables/hooks/useTableAreasManagement";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";

const NO_AREA = "no-area";
const COLUMNS = 3;

// `null` marks the "add table" card that closes each zone's grid.
type GridItem = Table | null;

const chunk = <T,>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, i * size + size),
  );

export default function TablesSettingsScreen() {
  const { t } = useTranslation("tables");
  const navigation = useNavigation();
  const { tables, tablesQuery } = useTables();
  const { isLoading, isError, refetch, isRefetching } = tablesQuery;
  const { updateTable, deleteTable } = useTablesManagement();
  const { user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const actionsSheetRef = useRef<BottomSheetMethods>(null);
  const { groups, hasAreas, areas } = useTableGroups(tables, {
    includeHidden: true,
    includeEmpty: true,
  });

  // Selección múltiple para mover mesas a otra zona: mantener presionada una
  // mesa empieza a seleccionar; mientras hay selección, tocar alterna.
  const { moveTables } = useTableAreasManagement();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isSelecting = selectedIds.size > 0;
  const canSelect = canManage && hasAreas;
  const areaPickerRef = useRef<BottomSheetPickerRef>(null);
  const areaOptions = useMemo(
    () => [
      ...sortAreas(areas).map((area) => ({ label: area.name, value: area.id })),
      { label: t("areas.noArea"), value: NO_AREA },
    ],
    [areas, t],
  );

  const toggleSelected = (tableId: string) =>
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(tableId)) next.delete(tableId);
      else next.add(tableId);
      return next;
    });

  const selectGroup = (groupTables: Table[]) =>
    setSelectedIds((current) => {
      const next = new Set(current);
      const allSelected = groupTables.every((table) => next.has(table.id));
      groupTables.forEach((table) =>
        allSelected ? next.delete(table.id) : next.add(table.id),
      );
      return next;
    });

  // La zona destino completa: sus mesas actuales y al final las movidas, en el
  // orden en que se ven. Sin toast de éxito: la mesa aparece en su nueva zona.
  const handleMoveToArea = async (value: string | number) => {
    const areaId = value === NO_AREA ? null : String(value);
    const groupKey = areaId ?? NO_AREA;
    const target = groups.find((g) => (g.area?.id ?? NO_AREA) === groupKey);
    const targetIds = (target?.tables ?? [])
      .map((table) => table.id)
      .filter((id) => !selectedIds.has(id));
    const movedIds = groups
      .filter((g) => (g.area?.id ?? NO_AREA) !== groupKey)
      .flatMap((g) => g.tables)
      .map((table) => table.id)
      .filter((id) => selectedIds.has(id));

    if (movedIds.length > 0) {
      await moveTables.mutateAsync({
        areaId,
        tableIds: [...targetIds, ...movedIds],
      });
    }
    setSelectedIds(new Set());
  };

  useEffect(() => {
    if (tables.length === 0) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canReorder = canManage && tables.length > 1;

  useEffect(() => {
    navigation.setOptions({
      headerRight: isSelecting
        ? () => (
            <Button
              label={t("areas.cancelSelection")}
              variant="surface"
              size="extra-small"
              onPress={() => setSelectedIds(new Set())}
            />
          )
        : canReorder
          ? () => (
              <Button
                leftIcon="arrow-up-down"
                variant="surface"
                size="extra-small"
                onPress={() => router.push("/(profile)/tables/reorder")}
              />
            )
          : undefined,
    });
  }, [navigation, canReorder, isSelecting, t]);

  const handleCreateTable = (areaId?: string) => {
    router.push({
      pathname: "/(profile)/tables/form",
      params: areaId ? { areaId } : {},
    });
  };

  const handleEditTable = (table: Table) => {
    router.push({
      pathname: "/(profile)/tables/form",
      params: {
        tableId: table.id,
        name: table.name,
        description: table.description || "",
        chairs: table.chairs != null ? String(table.chairs) : "",
        isActive: String(table.isActive !== false),
        isAvailable: String(table.isAvailable !== false),
        areaId: table.areaId ?? "",
      },
    });
  };

  const handleOpenTableActions = (table: Table) => {
    setSelectedTable(table);
    actionsSheetRef.current?.present();
  };

  const handleCloseTableActions = () => {
    actionsSheetRef.current?.dismiss();
  };

  const handleToggleActive = () => {
    if (!selectedTable) return;
    updateTable.mutate({
      id: selectedTable.id,
      isActive: !(selectedTable.isActive !== false),
    });
    handleCloseTableActions();
  };

  const handleConfirmDelete = async () => {
    if (!tableToDelete) return;
    await deleteTable.mutateAsync(tableToDelete.id);
    setTableToDelete(null);
  };

  const canAdd = canManage && !isSelecting;
  // Without the FAB the add card is the only way to create a table, so a
  // restaurant with no tables and no zones still needs one group to hold it.
  const visibleGroups =
    groups.length === 0 && canAdd && !isLoading && !isError
      ? [{ area: null, tables: [] as Table[] }]
      : groups;

  const renderTable = (table: Table) => {
    const isSelected = selectedIds.has(table.id);
    return (
      <Card
        onPress={
          isSelecting
            ? () => toggleSelected(table.id)
            : canManage
              ? () => handleOpenTableActions(table)
              : undefined
        }
        onLongPress={canSelect ? () => toggleSelected(table.id) : undefined}
        containerStyle={[tw`flex-1`, isSelected && tw`border-2 border-primary`]}
        style={[tw`flex-1 p-3`, table.isActive === false && tw`opacity-50`]}
        variant="outline"
      >
        <ThemedView style={tw`gap-3`}>
          <Icon
            name={isSelected ? "circle-check" : "layout-grid"}
            size={24}
            color={tw.color(isSelected ? "primary" : "text-on-surface-variant")}
          />
          <ThemedView style={tw`gap-1`}>
            <ThemedText
              type="body1"
              numberOfLines={2}
              style={{ fontFamily: typography.medium }}
            >
              {t("settings.tableName", { name: table.name })}
            </ThemedText>
            {table.chairs != null && (
              <ThemedText type="small" style={tw`text-primary`}>
                {t("settings.chairsCount", { count: table.chairs })}
              </ThemedText>
            )}
          </ThemedView>
        </ThemedView>
      </Card>
    );
  };

  const renderAddCard = (areaId?: string) => (
    <Card
      onPress={() => handleCreateTable(areaId)}
      accessibilityRole="button"
      accessibilityLabel={t("settings.newTable")}
      containerStyle={[tw`flex-1 border-dashed border-border`]}
      style={tw`flex-1 p-3 items-center justify-center gap-2 min-h-[104px]`}
      variant="outline"
    >
      <Icon name="plus" size={24} color={tw.color("primary")} />
      <ThemedText
        type="small"
        numberOfLines={2}
        style={[
          tw`text-primary text-center`,
          { fontFamily: typography.medium },
        ]}
      >
        {t("settings.newTable")}
      </ThemedText>
    </Card>
  );

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-2`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-8 pb-8`}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={tw.color("primary")}
            colors={[tw.color("primary") as string]}
          />
        }
      >
        {isLoading && tables.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="layout-grid" size={48} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("settings.loading")}
            </ThemedText>
          </ThemedView>
        )}

        {isError && tables.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
            <ThemedText type="body1" style={tw`text-red-500`}>
              {t("settings.loadError")}
            </ThemedText>
            <Button
              label={t("settings.retry")}
              onPress={() => refetch()}
              variant="outline"
            />
          </ThemedView>
        )}

        {!isLoading && !isError && tables.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="layout-grid" size={48} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("settings.noTables")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("settings.noTablesDescription")}
            </ThemedText>
          </ThemedView>
        )}

        {/* {canSelect && !isSelecting && tables.length > 1 && ( */}
        {/*   <ThemedText type="small" style={tw`text-gray-500`}> */}
        {/*     {t("areas.selectHint")} */}
        {/*   </ThemedText> */}
        {/* )} */}

        {visibleGroups.map((group) => (
          <ThemedView key={group.area?.id ?? "no-area"} style={tw`gap-3`}>
            {hasAreas && (
              <ThemedView style={tw`flex-row items-center gap-2`}>
                <ThemedText type="h4">
                  {group.area?.name ?? t("areas.noArea")}
                </ThemedText>
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {t("areas.tablesCount", { count: group.tables.length })}
                </ThemedText>
                {group.area && !group.area.isActive && (
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    · {t("areas.hidden")}
                  </ThemedText>
                )}
                {isSelecting && group.tables.length > 0 && (
                  <Button
                    label={t("areas.selectAll")}
                    variant="surface"
                    size="extra-small"
                    style={tw`ml-auto`}
                    onPress={() => selectGroup(group.tables)}
                  />
                )}
              </ThemedView>
            )}
            <ThemedView style={tw`gap-3`}>
              {chunk<GridItem>(
                canAdd ? [...group.tables, null] : group.tables,
                COLUMNS,
              ).map((row, rowIndex) => (
                <ThemedView key={rowIndex} style={tw`flex-row gap-3`}>
                  {Array.from({ length: COLUMNS }, (_, col) => {
                    const item = row[col];
                    return (
                      <ThemedView
                        key={item?.id ?? `slot-${col}`}
                        style={tw`flex-1`}
                      >
                        {item === undefined
                          ? null
                          : item === null
                            ? renderAddCard(group.area?.id)
                            : renderTable(item)}
                      </ThemedView>
                    );
                  })}
                </ThemedView>
              ))}
            </ThemedView>
          </ThemedView>
        ))}
        {canManage && (
          <ThemedView style={tw`gap-8`}>
            {canAdd && (
              <ThemedView style={tw`items-center flex-row`}>
                <Button
                  label={t("areas.newArea")}
                  leftIcon="plus"
                  variant="outline"
                  size="small"
                  onPress={() => router.push("/(profile)/tables/areas/form")}
                />
              </ThemedView>
            )}
            <Button
              label={t("areas.manage")}
              leftIcon="gallery-vertical-end"
              variant="text"
              size="small"
              onPress={() => router.push("/(profile)/tables/areas")}
            />
          </ThemedView>
        )}
      </ScrollView>

      {isSelecting && (
        <ThemedView
          style={tw`absolute bottom-6 left-4 right-4 flex-row items-center gap-4 p-4 rounded-3xl bg-surface-high`}
        >
          <ThemedText type="body1" style={tw`flex-1`}>
            {t("areas.selectedCount", { count: selectedIds.size })}
          </ThemedText>
          <Button
            label={t("areas.moveToArea")}
            leftIcon="gallery-vertical-end"
            size="small"
            loading={moveTables.isPending}
            disabled={moveTables.isPending}
            onPress={() => areaPickerRef.current?.present()}
          />
        </ThemedView>
      )}

      <BottomSheetPicker
        ref={areaPickerRef}
        title={t("areas.moveToArea")}
        options={areaOptions}
        onChange={(value) => void handleMoveToArea(value).catch(() => {})}
      />

      <ThemedBottomSheetModal ref={actionsSheetRef} enablePanDownToClose>
        {selectedTable && (
          <ThemedView style={tw`px-4 py-4 gap-6`}>
            <ThemedView style={tw`flex-row justify-between items-start gap-3`}>
              <ThemedView style={tw`flex-1 gap-2`}>
                <ThemedText type="h2" style={{ fontFamily: typography.medium }}>
                  {t("settings.tableName", { name: selectedTable.name })}
                </ThemedText>
                <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
                  <ThemedView style={tw`flex-row items-center gap-1`}>
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {t("settings.chairsCount", {
                        count: selectedTable.chairs ?? 0,
                      })}
                    </ThemedText>
                  </ThemedView>
                  {/* <Label */}
                  {/*   text={ */}
                  {/*     selectedTable.isActive !== false */}
                  {/*       ? t("settings.active") */}
                  {/*       : t("settings.inactive") */}
                  {/*   } */}
                  {/*   color={ */}
                  {/*     selectedTable.isActive !== false ? "success" : "default" */}
                  {/*   } */}
                  {/*   size="small" */}
                  {/* /> */}
                </ThemedView>
                {!!selectedTable.description && (
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {selectedTable.description}
                  </ThemedText>
                )}
              </ThemedView>
              <IconButton
                icon={selectedTable.isActive !== false ? "eye" : "eye-off"}
                variant="surface"
                onPress={handleToggleActive}
              />
            </ThemedView>
            <ThemedView style={tw`flex-row gap-4 items-center`}>
              <Button
                label={t("settings.delete")}
                leftIcon="trash"
                variant="destructive"
                onPress={() => {
                  handleCloseTableActions();
                  setTableToDelete(selectedTable);
                }}
              />
              <Button
                label={t("settings.edit")}
                leftIcon="square-pen"
                variant="surface"
                style={tw`flex-1`}
                onPress={() => {
                  handleCloseTableActions();
                  handleEditTable(selectedTable);
                }}
              />
            </ThemedView>
          </ThemedView>
        )}
      </ThemedBottomSheetModal>

      <DialogModal
        visible={!!tableToDelete}
        title={t("settings.deleteTitle")}
        message={t("settings.deleteMessage")}
        confirmLabel={t("settings.confirm")}
        cancelLabel={t("settings.cancel")}
        confirmVariant="destructive"
        loading={deleteTable.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTableToDelete(null)}
      />
    </ScreenLayout>
  );
}
