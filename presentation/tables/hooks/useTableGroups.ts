import { useMemo } from "react";
import type { Table } from "@/core/tables/models/table.model";
import type { TableArea } from "@/core/tables/models/table-area.model";
import { useTablesStore } from "./useTablesStore";

export interface TableGroup {
  /** null = "Sin zona". */
  area: TableArea | null;
  tables: Table[];
}

export const byOrder = (a: Table, b: Table) =>
  (a.order ?? 0) - (b.order ?? 0) ||
  a.name.localeCompare(b.name, undefined, { numeric: true });

export const sortAreas = (areas: TableArea[]) =>
  [...areas].sort((a, b) => a.order - b.order);

/**
 * Agrupa las mesas por zona: zonas por `order`, mesas por `order` dentro de
 * cada una y "Sin zona" al final. El orden sale de aquí y no del orden del
 * array del store, que no se reordena cuando llega un TABLE UPDATED.
 *
 * - `includeHidden`: incluye zonas ocultas (en ajustes). Para meseros, las
 *   mesas de una zona oculta no se muestran.
 * - `includeEmpty`: incluye zonas sin mesas (en ajustes).
 */
export function groupTablesByArea(
  tables: Table[],
  areas: TableArea[],
  { includeHidden = false, includeEmpty = false } = {},
): TableGroup[] {
  const known = new Map(areas.map((area) => [area.id, area]));
  const visibleAreas = sortAreas(
    includeHidden ? areas : areas.filter((area) => area.isActive),
  );

  const groups: TableGroup[] = visibleAreas.map((area) => ({
    area,
    tables: [],
  }));
  const byArea = new Map(groups.map((group) => [group.area!.id, group]));
  const noArea: TableGroup = { area: null, tables: [] };

  for (const table of tables) {
    const area = table.areaId ? known.get(table.areaId) : undefined;
    if (!area) {
      // Sin zona, o una zona que el teléfono aún no conoce.
      noArea.tables.push(table);
    } else {
      // Undefined cuando la zona está oculta: la mesa no se muestra.
      byArea.get(area.id)?.tables.push(table);
    }
  }

  groups.forEach((group) => group.tables.sort(byOrder));
  noArea.tables.sort(byOrder);

  return [
    ...groups.filter((group) => includeEmpty || group.tables.length > 0),
    ...(noArea.tables.length > 0 ? [noArea] : []),
  ];
}

export const useTableGroups = (
  tables: Table[],
  options: { includeHidden?: boolean; includeEmpty?: boolean } = {},
) => {
  const areas = useTablesStore((state) => state.areas);
  const { includeHidden, includeEmpty } = options;

  return useMemo(() => {
    const groups = groupTablesByArea(tables, areas, {
      includeHidden,
      includeEmpty,
    });
    const hasAreas =
      (includeHidden ? areas : areas.filter((a) => a.isActive)).length > 0;
    return { groups, hasAreas, areas };
  }, [tables, areas, includeHidden, includeEmpty]);
};
