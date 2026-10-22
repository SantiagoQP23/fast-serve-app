import { useEffect, useMemo } from "react";
import { ScrollView } from "react-native";
import { router, useNavigation } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Fab from "@/presentation/theme/components/fab";
import type { TableArea } from "@/core/tables/models/table-area.model";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import { sortAreas } from "@/presentation/tables/hooks/useTableGroups";

export default function TableAreasSettingsScreen() {
  const { t } = useTranslation("tables");
  const navigation = useNavigation();
  const areas = useTablesStore((state) => state.areas);
  const tables = useTablesStore((state) => state.tables);
  const sortedAreas = useMemo(() => sortAreas(areas), [areas]);

  const canReorder = sortedAreas.length > 1;

  useEffect(() => {
    navigation.setOptions({
      headerRight: canReorder
        ? () => (
            <Button
              label={t("areas.reorder")}
              leftIcon="arrow-up-down"
              variant="surface"
              size="extra-small"
              onPress={() =>
                router.push({
                  pathname: "/(profile)/tables/reorder",
                  params: { mode: "areas" },
                })
              }
            />
          )
        : undefined,
    });
  }, [navigation, canReorder, t]);

  const tableCount = (areaId: string) =>
    tables.filter((table) => table.areaId === areaId).length;

  const openForm = (area?: TableArea) => {
    router.push({
      pathname: "/(profile)/tables/areas/form",
      params: area ? { areaId: area.id, name: area.name } : {},
    });
  };

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-2`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-24`}
      >
        {sortedAreas.length === 0 ? (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="gallery-vertical-end" size={48} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("areas.noAreas")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("areas.noAreasDescription")}
            </ThemedText>
          </ThemedView>
        ) : (
          sortedAreas.map((area) => (
            <Card
              key={area.id}
              onPress={() => openForm(area)}
              style={!area.isActive && tw`opacity-50`}
            >
              <ThemedView style={tw`flex-row items-center gap-4`}>
                <Icon
                  name="gallery-vertical-end"
                  size={28}
                  color={tw.color("text-on-surface-variant")}
                />
                <ThemedView style={tw`flex-1 gap-1`}>
                  <ThemedText type="h4">{area.name}</ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("areas.tablesCount", { count: tableCount(area.id) })}
                    {!area.isActive ? ` · ${t("areas.hidden")}` : ""}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </Card>
          ))
        )}
      </ScrollView>

      <Fab icon="plus" onPress={() => openForm()} />
    </ScreenLayout>
  );
}
