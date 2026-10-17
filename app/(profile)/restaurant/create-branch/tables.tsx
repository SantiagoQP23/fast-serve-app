import { ScrollView, View } from "react-native";
import { router } from "expo-router";

import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import { sortAreas } from "@/presentation/tables/hooks/useTableGroups";
import {
  BRANCH_MAX_TABLES,
  NO_AREA_KEY,
  useCreateBranchStore,
} from "@/presentation/restaurant/store/useCreateBranchStore";

import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Counter from "@/presentation/theme/components/counter";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";

/**
 * Paso 2 de "Crear sucursal": cuántas mesas tendrá. Con zonas, una cantidad
 * por zona (prellenada con las de hoy); sin zonas, un solo número.
 */
export default function CreateBranchTablesScreen() {
  const { t } = useTranslation(["auth", "tables"]);
  const areas = useTablesStore((state) => state.areas);
  const { tables, setTables } = useCreateBranchStore();

  const sortedAreas = sortAreas(areas);
  const hasAreas = sortedAreas.length > 0;
  // "Sin zona" solo aparece si no hay zonas o si hoy hay mesas sin zona.
  const showNoArea = !hasAreas || (tables[NO_AREA_KEY] ?? 0) > 0;

  const rows = [
    ...sortedAreas.map((area) => ({ key: area.id, label: area.name })),
    ...(showNoArea
      ? [
          {
            key: NO_AREA_KEY,
            label: hasAreas
              ? t("tables:areas.noArea")
              : t("auth:createBranch.tables.quantity"),
          },
        ]
      : []),
  ];

  const total = rows.reduce((sum, row) => sum + (tables[row.key] ?? 0), 0);
  const error =
    total < 1
      ? t("auth:createBranch.tables.min")
      : total > BRANCH_MAX_TABLES
        ? t("auth:createBranch.tables.max", { max: BRANCH_MAX_TABLES })
        : undefined;

  const setQuantity = (key: string, quantity: number) =>
    setTables({ ...useCreateBranchStore.getState().tables, [key]: quantity });

  return (
    <ScreenLayout style={tw`flex-1 px-4`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`gap-6 pt-2 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={tw`gap-2`}>
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("auth:createBranch.steps", { step: 2 })}
          </ThemedText>
          <ThemedText type="body2" style={tw`text-gray-600`}>
            {hasAreas
              ? t("auth:createBranch.tables.subtitleByArea")
              : t("auth:createBranch.tables.subtitle")}
          </ThemedText>
        </ThemedView>

        <ThemedView style={tw`gap-3`}>
          {rows.map((row) => (
            <Card
              key={row.key}
              variant="outline"
              style={tw`flex-row items-center justify-between gap-4`}
            >
              <ThemedText
                type="body1"
                style={[tw`flex-1`, { fontFamily: typography.medium }]}
              >
                {row.label}
              </ThemedText>
              {/* Counter's value box is flex-1: without a fixed width here it
                  takes the whole row and squeezes the area name to nothing. */}
              <View style={tw`w-44`}>
                <Counter
                  value={tables[row.key] ?? 0}
                  onChangeValue={(value) => setQuantity(row.key, value)}
                  min={0}
                  max={BRANCH_MAX_TABLES}
                  size="small"
                />
              </View>
            </Card>
          ))}
        </ThemedView>

        {hasAreas && (
          <ThemedText type="body2" style={tw`text-center`}>
            {t("auth:createBranch.tables.total", { count: total })}
          </ThemedText>
        )}
      </ScrollView>

      <ThemedView style={tw`gap-2 mb-8`}>
        {!!error && (
          <ThemedText type="small" style={tw`text-red-500 text-center`}>
            {error}
          </ThemedText>
        )}
        <Button
          label={t("auth:createBranch.next")}
          onPress={() =>
            router.push("/(profile)/restaurant/create-branch/users")
          }
          disabled={!!error}
        />
      </ThemedView>
    </ScreenLayout>
  );
}
