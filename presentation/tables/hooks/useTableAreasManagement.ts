import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getErrorMessage } from "@/core/api/get-error-message";
import { TableAreasService } from "@/core/tables/services/table-areas.service";
import { TablesService } from "@/core/tables/services/tables.service";
import type { TableArea } from "@/core/tables/models/table-area.model";
import type { Table } from "@/core/tables/models/table.model";
import { useTablesStore } from "./useTablesStore";

// Sin toast de éxito al crear/editar/ordenar: la pantalla actualizada es la
// confirmación. Errores y borrados sí muestran toast.
export const useTableAreasManagement = () => {
  const { t } = useTranslation("tables");
  const { upsertArea, removeArea, setAreas, upsertTables } = useTablesStore();

  const createArea = useMutation<TableArea, Error, string>({
    mutationFn: (name) => TableAreasService.create(name),
    onSuccess: (area) => upsertArea(area),
    onError: (error) =>
      toast.error(getErrorMessage(error, { fallback: t("areas.createError") })),
  });

  const updateArea = useMutation<
    TableArea,
    Error,
    { id: string; name?: string; isActive?: boolean }
  >({
    mutationFn: ({ id, ...data }) => TableAreasService.update(id, data),
    onSuccess: (area) => upsertArea(area),
    onError: (error) =>
      toast.error(getErrorMessage(error, { fallback: t("areas.updateError") })),
  });

  const deleteArea = useMutation<void, Error, string>({
    mutationFn: (id) => TableAreasService.remove(id),
    onSuccess: (_, id) => {
      removeArea(id);
      // Sus mesas pasan a "Sin zona"; los TABLE UPDATED traen su nuevo orden.
      upsertTables(
        useTablesStore
          .getState()
          .tables.filter((table) => table.areaId === id)
          .map((table) => ({ ...table, areaId: null })),
      );
      toast.success(t("areas.deleteSuccess"));
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, { fallback: t("areas.deleteError") })),
  });

  const reorderAreas = useMutation<TableArea[], Error, string[]>({
    mutationFn: (areaIds) => TableAreasService.reorder(areaIds),
    onSuccess: (areas) => setAreas(areas),
    onError: (error) =>
      toast.error(getErrorMessage(error, { fallback: t("reorder.error") })),
  });

  const reorderTables = useMutation<
    Table[],
    Error,
    { areaId: string | null; tableIds: string[] }
  >({
    mutationFn: ({ areaId, tableIds }) =>
      TablesService.reorderTables(areaId, tableIds),
    onSuccess: (tables) => upsertTables(tables),
    onError: (error) =>
      toast.error(getErrorMessage(error, { fallback: t("reorder.error") })),
  });

  return { createArea, updateArea, deleteArea, reorderAreas, reorderTables };
};
