import { useMemo } from "react";
import { Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Label from "@/presentation/theme/components/label";
import DetailHeader from "@/presentation/theme/components/detail-header";
import type { TableArea } from "@/core/tables/models/table-area.model";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import { sortAreas } from "@/presentation/tables/hooks/useTableGroups";

export default function TableAreasSettingsScreen() {
  const { t } = useTranslation("tables");
  const areas = useTablesStore((state) => state.areas);
  const tables = useTablesStore((state) => state.tables);
  const sortedAreas = useMemo(() => sortAreas(areas), [areas]);

  const canReorder = sortedAreas.length > 1;

  const tableCount = (areaId: string) =>
    tables.filter((table) => table.areaId === areaId).length;

  const openForm = (area?: TableArea) => {
    router.push({
      pathname: "/(profile)/tables/areas/form",
      params: area ? { areaId: area.id, name: area.name } : {},
    });
  };

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
      <ThemedView style={tw`items-center flex-row mb-6`}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t("common:actions.goBack")}
          hitSlop={12}
          style={({ pressed }) => tw.style(pressed && "opacity-70")}
        >
          <Icon name="arrow-left" color={tw.color("on-surface")} size={24} />
        </Pressable>
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
      >
        <DetailHeader
          title={t("areas.title")}
          subtitle={t("areas.manageDescription")}
        >
          <ThemedView style={tw`flex-row flex-wrap gap-3`}>
            <Button
              label={t("areas.newArea")}
              leftIcon="plus"
              shape="rounded"
              size="small"
              onPress={() => openForm()}
            />
            {canReorder && (
              <Button
                leftIcon="arrow-up-down"
                accessibilityLabel={t("areas.reorder")}
                variant="surface"
                shape="rounded"
                size="small"
                onPress={() =>
                  router.push({
                    pathname: "/(profile)/tables/reorder",
                    params: { mode: "areas" },
                  })
                }
              />
            )}
          </ThemedView>
        </DetailHeader>

        {sortedAreas.length === 0 ? (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon
              name="gallery-vertical-end"
              size={48}
              color={tw.color("gray-400")}
            />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("areas.noAreas")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("areas.noAreasDescription")}
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={tw`gap-4`}>
            {sortedAreas.map((area) => (
              <Card
                key={area.id}
                onPress={() => openForm(area)}
                style={!area.isActive && tw`opacity-50`}
                variant="outline"
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
                    </ThemedText>
                    {!area.isActive && (
                      // A row, so the Label keeps its own width
                      <ThemedView style={tw`flex-row`}>
                        <Label text={t("areas.hidden")} />
                      </ThemedView>
                    )}
                  </ThemedView>
                </ThemedView>
              </Card>
            ))}
          </ThemedView>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}
