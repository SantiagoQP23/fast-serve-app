import { useEffect } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useTables } from "@/presentation/tables/hooks/useTables";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Fab from "@/presentation/theme/components/fab";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
import type { Table } from "@/core/tables/models/table.model";

export default function TablesSettingsScreen() {
  const { t } = useTranslation("tables");
  const { tables, tablesQuery } = useTables();
  const { isLoading, isError, refetch, isRefetching } = tablesQuery;

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
          <ThemedView style={tw`gap-4`}>
            {tables.map((table) => (
              <Card key={table.id} onPress={() => handleEditTable(table)}>
                <ThemedView style={tw`flex-row items-center justify-between`}>
                  <ThemedView style={tw`gap-4 flex-1 flex-row items-center`}>
                    <Ionicons
                      name="grid-outline"
                      size={28}
                      color={tw.color("text-light-on-surface-variant")}
                    />
                    <ThemedView style={tw`flex-1 gap-2`}>
                      <ThemedText type="h4">
                        {t("settings.tableName", { name: table.name })}
                      </ThemedText>
                      <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
                        {table.chairs != null && (
                          <ThemedText type="small" style={tw`text-gray-500`}>
                            {t("settings.chairsCount", {
                              count: table.chairs,
                            })}
                          </ThemedText>
                        )}
                        {table.description ? (
                          <ThemedText type="small" style={tw`text-gray-500`}>
                            • {table.description}
                          </ThemedText>
                        ) : null}
                        {table.isActive === false && (
                          <Label
                            text={t("settings.inactive")}
                            color="error"
                            size="small"
                          />
                        )}
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>
                  <IconButton
                    icon="create-outline"
                    size={20}
                    variant="text"
                    onPress={() => handleEditTable(table)}
                  />
                </ThemedView>
              </Card>
            ))}
          </ThemedView>
        )}
      </ScrollView>

      <Fab icon="add" onPress={handleCreateTable} />
    </ScreenLayout>
  );
}
