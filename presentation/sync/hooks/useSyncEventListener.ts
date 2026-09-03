import { useWebsocketEventListener } from "@/presentation/shared/hooks/useWebsocketEventListener";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";
import { SyncEventDto } from "@/core/sync/dto/sync-response.dto";
import { SyncResourceType } from "@/core/sync/enums/sync-resource-type.enum";
import { SyncOperation } from "@/core/sync/enums/sync-operation.enum";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useProductionAreasStore } from "@/presentation/production-areas/store/useProductionAreasStore";
import { RestaurantMenuService } from "@/core/menu/services/restaurant-menu.service";
import { ProductionAreasService } from "@/presentation/production-areas/services/production-areas.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Order } from "@/core/orders/models/order.model";
import { Table } from "@/core/tables/models/table.model";
import { useSyncStore } from "../store/useSyncStore";

function applyOrderEvent(event: SyncEventDto) {
  const order = event.data as Order;
  const ordersState = useOrdersStore.getState();

  switch (event.operation) {
    case SyncOperation.CREATED:
      ordersState.addOrder(order);
      break;
    case SyncOperation.UPDATED:
      if (ordersState.orders.some((o) => o.id === order.id)) {
        ordersState.updateOrder(order);
      } else {
        ordersState.addOrder(order);
      }
      break;
    case SyncOperation.DELETED:
      ordersState.deleteOrder(event.resourceId);
      break;
  }
}

function applyTableEvent(event: SyncEventDto) {
  const table = event.data as Table;
  const tablesState = useTablesStore.getState();

  switch (event.operation) {
    case SyncOperation.CREATED:
      tablesState.addTable(table);
      break;
    case SyncOperation.UPDATED:
      tablesState.updateTable(table);
      break;
    case SyncOperation.DELETED:
      tablesState.deleteTable(event.resourceId);
      break;
  }
}

async function refetchMenu(restaurantId: string) {
  try {
    const menu = await RestaurantMenuService.getAllMenu(restaurantId);
    useMenuStore.getState().setMenu(menu, restaurantId);
  } catch (error) {
    console.error("[useSyncEventListener] Failed to refetch menu", error);
  }
}

async function refetchProductionAreas(restaurantId: string) {
  try {
    const areas = await ProductionAreasService.getAll();
    useProductionAreasStore.getState().setProductionAreas(areas, restaurantId);
  } catch (error) {
    console.error(
      "[useSyncEventListener] Failed to refetch production areas",
      error,
    );
  }
}

export const useSyncEventListener = () => {
  const { currentRestaurant } = useAuthStore();

  useWebsocketEventListener<SyncEventDto>(
    OrderSocketEvent.syncEvent,
    ({ data: event }) => {
      if (!event) return;
      console.log("[useSyncEventListener] Received sync event", event);

      const restaurantId = currentRestaurant?.id;
      if (!restaurantId) return;

      switch (event.resourceType) {
        case SyncResourceType.ORDER:
          applyOrderEvent(event);
          break;
        case SyncResourceType.TABLE:
          applyTableEvent(event);
          break;
        case SyncResourceType.PRODUCT:
        case SyncResourceType.CATEGORY:
        case SyncResourceType.SECTION:
          void refetchMenu(restaurantId);
          break;
        case SyncResourceType.PRODUCTION_AREA:
          void refetchProductionAreas(restaurantId);
          break;
        case SyncResourceType.BILL:
        case SyncResourceType.RESTAURANT:
        case SyncResourceType.SETTINGS:
          // Intentionally ignored for now.
          break;
        default:
          console.warn(
            "[useSyncEventListener] Unknown sync resource type",
            event.resourceType,
          );
      }

      const syncState = useSyncStore.getState();
      if (event.sequence > syncState.lastSequence) {
        syncState.setSynced(event.sequence);
      }
    },
  );
};
