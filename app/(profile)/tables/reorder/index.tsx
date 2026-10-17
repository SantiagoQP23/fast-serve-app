import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import ReorderableList, {
  reorderItems,
  useReorderableDrag,
} from "react-native-reorderable-list";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import Chip from "@/presentation/theme/components/chip";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import {
  groupTablesByArea,
  sortAreas,
} from "@/presentation/tables/hooks/useTableGroups";
import { useTableAreasManagement } from "@/presentation/tables/hooks/useTableAreasManagement";
import { SocketContext } from "@/presentation/shared/context/SocketContext";

const NO_AREA = "no-area";

interface Row {
  id: string;
  title: string;
  subtitle?: string;
}

function DraggableRow({ row }: { row: Row }) {
  const drag = useReorderableDrag();

  return (
    <Pressable
      onLongPress={drag}
      delayLongPress={200}
      style={({ pressed }) =>
        tw.style(
          "flex-row items-center gap-4 px-4 py-4 mb-2 rounded-2xl bg-surface",
          pressed && "opacity-80",
        )
      }
    >
      <Ionicons
        name="reorder-three-outline"
        size={24}
        color={tw.color("text-on-surface-variant")}
      />
      <ThemedView style={tw`flex-1 bg-transparent`}>
        <ThemedText type="body1" style={{ fontFamily: typography.medium }}>
          {row.title}
        </ThemedText>
        {!!row.subtitle && (
          <ThemedText type="small" style={tw`text-gray-500`}>
            {row.subtitle}
          </ThemedText>
        )}
      </ThemedView>
    </Pressable>
  );
}

/**
 * Ordenar mesas (por zona) o, con `mode=areas`, ordenar las zonas. Los cambios
 * quedan en el teléfono hasta "Guardar", que manda una petición por zona
 * cambiada. Sin toast de éxito: volver a la pantalla anterior lo confirma.
 */
export default function TablesReorderScreen() {
  const { t } = useTranslation("tables");
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isAreasMode = mode === "areas";
  const navigation = useNavigation();
  const { online } = useContext(SocketContext);

  const tables = useTablesStore((state) => state.tables);
  const areas = useTablesStore((state) => state.areas);
  const { reorderTables, reorderAreas } = useTableAreasManagement();

  // Orden inicial de cada lista: zonas, o mesas de cada zona ("no-area" = Sin zona).
  const initial = useMemo(() => {
    if (isAreasMode) {
      return { areas: sortAreas(areas).map((area) => area.id) };
    }
    const groups = groupTablesByArea(tables, areas, {
      includeHidden: true,
      includeEmpty: true,
    });
    return Object.fromEntries(
      groups.map((group) => [
        group.area?.id ?? NO_AREA,
        group.tables.map((table) => table.id),
      ]),
    ) as Record<string, string[]>;
    // Solo al abrir: los eventos de sync no deben mover lo que se está ordenando.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [draft, setDraft] = useState<Record<string, string[]>>(initial);
  const listKeys = Object.keys(initial);
  const [selectedKey, setSelectedKey] = useState(listKeys[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const pendingAction = useRef<any>(null);

  const changedKeys = listKeys.filter(
    (key) => draft[key].join() !== initial[key].join(),
  );
  const isDirty = changedKeys.length > 0;

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!isDirty || isSaving) return;
      e.preventDefault();
      pendingAction.current = e.data.action;
      setShowDiscard(true);
    });
    return unsubscribe;
  }, [navigation, isDirty, isSaving]);

  const tableById = useMemo(
    () => new Map(tables.map((table) => [table.id, table])),
    [tables],
  );
  const areaById = useMemo(
    () => new Map(areas.map((area) => [area.id, area])),
    [areas],
  );

  const rows: Row[] = (draft[selectedKey] ?? []).flatMap((id) => {
    if (isAreasMode) {
      const area = areaById.get(id);
      return area
        ? [
            {
              id,
              title: area.name,
              subtitle: area.isActive ? undefined : t("areas.hidden"),
            },
          ]
        : [];
    }
    const table = tableById.get(id);
    return table
      ? [
          {
            id,
            title: t("settings.tableName", { name: table.name }),
            subtitle:
              table.chairs != null
                ? t("settings.chairsCount", { count: table.chairs })
                : undefined,
          },
        ]
      : [];
  });

  const handleSave = async () => {
    if (!isDirty) {
      router.back();
      return;
    }
    setIsSaving(true);
    try {
      if (isAreasMode) {
        await reorderAreas.mutateAsync(draft.areas);
      } else {
        for (const key of changedKeys) {
          await reorderTables.mutateAsync({
            areaId: key === NO_AREA ? null : key,
            tableIds: draft[key],
          });
        }
      }
      router.back();
    } catch {
      // El hook ya mostró el toast de error; los cambios siguen en pantalla.
      setIsSaving(false);
    }
  };

  const showAreaChips = !isAreasMode && listKeys.length > 1;

  return (
    <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ThemedView style={tw`items-center gap-2 flex-row justify-between`}>
        <ThemedView style={tw`items-center gap-4 flex-row flex-1`}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Ionicons name="arrow-back-outline" color={tw.color("on-surface")} size={24} />
          </Pressable>
          <ThemedText type="h3" style={{ fontFamily: typography.regular }}>
            {isAreasMode ? t("reorder.areasTitle") : t("reorder.title")}
          </ThemedText>
        </ThemedView>
        <Button
          label={t("reorder.save")}
          size="small"
          onPress={handleSave}
          variant="text"
          loading={isSaving}
          disabled={isSaving || (isDirty && !online)}
        />
      </ThemedView>

      <ThemedText type="small" style={tw`text-gray-500`}>
        {isDirty && !online ? t("reorder.offline") : t("reorder.hint")}
      </ThemedText>

      {showAreaChips && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={tw`grow-0`}
          contentContainerStyle={tw`gap-2`}
        >
          {listKeys.map((key) => (
            <Chip
              key={key}
              label={
                key === NO_AREA
                  ? t("areas.noArea")
                  : (areaById.get(key)?.name ?? "")
              }
              selected={selectedKey === key}
              onPress={() => setSelectedKey(key)}
            />
          ))}
        </ScrollView>
      )}

      {rows.length === 0 ? (
        <ThemedView style={tw`items-center py-8`}>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {t("reorder.empty")}
          </ThemedText>
        </ThemedView>
      ) : (
        <ReorderableList
          // Una lista por zona: cambiar de zona monta la nueva.
          key={selectedKey}
          data={rows}
          keyExtractor={(row) => row.id}
          renderItem={({ item }) => <DraggableRow row={item} />}
          onReorder={({ from, to }) =>
            setDraft((current) => ({
              ...current,
              [selectedKey]: reorderItems(current[selectedKey], from, to),
            }))
          }
          contentContainerStyle={tw`pb-8`}
          showsVerticalScrollIndicator={false}
        />
      )}

      <DialogModal
        visible={showDiscard}
        title={t("reorder.discardTitle")}
        message={t("reorder.discardMessage")}
        confirmLabel={t("reorder.discard")}
        cancelLabel={t("reorder.keepEditing")}
        confirmVariant="destructive"
        onConfirm={() => {
          setShowDiscard(false);
          if (pendingAction.current) navigation.dispatch(pendingAction.current);
        }}
        onCancel={() => {
          pendingAction.current = null;
          setShowDiscard(false);
        }}
      />
    </ScreenLayout>
  );
}
