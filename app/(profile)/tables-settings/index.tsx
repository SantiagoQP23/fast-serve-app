import { useEffect, useRef, useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
import Fab from "@/presentation/theme/components/fab";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import Label from "@/presentation/theme/components/label";
import type { Table } from "@/core/tables/models/table.model";
import IconButton from "@/presentation/theme/components/icon-button";
import { typography } from "@/constants/theme";

export default function TablesSettingsScreen() {
  const { t } = useTranslation("tables");
  const { tables, tablesQuery } = useTables();
  const { isLoading, isError, refetch, isRefetching } = tablesQuery;
  const { updateTable, deleteTable } = useTablesManagement();
  const { user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const actionsSheetRef = useRef<BottomSheetMethods>(null);

  useEffect(() => {
    if (tables.length === 0) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateTable = () => {
    router.push("/(profile)/table-settings-form");
  };

  const handleEditTable = (table: Table) => {
    router.push({
      pathname: "/(profile)/table-settings-form",
      params: {
        tableId: table.id,
        name: table.name,
        description: table.description || "",
        chairs: table.chairs != null ? String(table.chairs) : "",
        isActive: String(table.isActive !== false),
        isAvailable: String(table.isAvailable !== false),
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

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-2`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={tw.color("blue-500")}
            colors={[tw.color("blue-500") || "#3b82f6"]}
          />
        }
      >
        {isLoading && tables.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="grid-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("settings.loading")}
            </ThemedText>
          </ThemedView>
        )}

        {isError && tables.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
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
            <Ionicons name="grid-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("settings.noTables")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("settings.noTablesDescription")}
            </ThemedText>
          </ThemedView>
        )}

        {tables.length > 0 && (
          <ThemedView style={tw`flex-row flex-wrap justify-between gap-y-4`}>
            {tables.map((table) => (
              <ThemedView key={table.id} style={tw`w-[48%]`}>
                <Card
                  onPress={
                    canManage ? () => handleOpenTableActions(table) : undefined
                  }
                  style={table.isActive === false && tw`opacity-50`}
                >
                  <ThemedView style={tw`gap-4`}>
                    <Ionicons
                      name="grid-outline"
                      size={28}
                      color={tw.color("text-light-on-surface-variant")}
                    />
                    <ThemedView style={tw`gap-2`}>
                      <ThemedText type="h4">
                        {t("settings.tableName", { name: table.name })}
                      </ThemedText>
                      <ThemedView
                        style={tw`flex-row items-center gap-2 flex-wrap`}
                      >
                        {table.chairs != null && (
                          <ThemedText type="small" style={tw`text-gray-500`}>
                            {t("settings.chairsCount", {
                              count: table.chairs,
                            })}
                          </ThemedText>
                        )}
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>
                </Card>
              </ThemedView>
            ))}
          </ThemedView>
        )}
      </ScrollView>

      {canManage && <Fab icon="add" onPress={handleCreateTable} />}

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
                icon={
                  selectedTable.isActive !== false
                    ? "eye-outline"
                    : "eye-off-outline"
                }
                variant="secondary"
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
                leftIcon="create"
                variant="secondary"
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
