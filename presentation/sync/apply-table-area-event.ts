import { SyncEventDto } from "@/core/sync/dto/sync-response.dto";
import { SyncOperation } from "@/core/sync/enums/sync-operation.enum";
import { TableArea } from "@/core/tables/models/table-area.model";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";

// Al borrar una zona, el backend manda también un TABLE UPDATED por cada mesa
// que pasa a "Sin zona", así que aquí solo se toca la zona.
export function applyTableAreaEvent(event: SyncEventDto) {
  const tablesState = useTablesStore.getState();

  switch (event.operation) {
    case SyncOperation.CREATED:
    case SyncOperation.UPDATED:
      tablesState.upsertArea(event.data as TableArea);
      break;
    case SyncOperation.DELETED:
      tablesState.removeArea(event.resourceId);
      break;
  }
}
