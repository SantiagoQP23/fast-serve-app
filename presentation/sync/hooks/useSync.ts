import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useGlobalStore } from "@/presentation/shared/store/useGlobalStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useProductionAreasStore } from "@/presentation/production-areas/store/useProductionAreasStore";
import { SyncService } from "@/core/sync/services/sync.service";
import {
  SyncEventDto,
  IncrementalSyncResponseDto,
  SnapshotSyncResponseDto,
} from "@/core/sync/dto/sync-response.dto";
import { SyncOperation } from "@/core/sync/enums/sync-operation.enum";
import { SyncResourceType } from "@/core/sync/enums/sync-resource-type.enum";
import { RestaurantMenuService } from "@/core/menu/services/restaurant-menu.service";
import { ProductionAreasService } from "@/presentation/production-areas/services/production-areas.service";
import { Order } from "@/core/orders/models/order.model";
import { Table } from "@/core/tables/models/table.model";
import { Menu } from "@/core/menu/models/menu.model";
import { ProductionArea } from "@/core/menu/models/producion-area.model";
import { useSyncStore } from "../store/useSyncStore";
import { useAppForeground } from "@/presentation/shared/hooks/useAppForeground";

const INCREMENTAL_SYNC_LIMIT = 1000;

function applySnapshot(
  snapshot: SnapshotSyncResponseDto,
  restaurantId: string,
) {
  const orders = (snapshot.orders ?? []) as Order[];
  const tables = (snapshot.tables ?? []) as Table[];
  const products = (snapshot.products ?? []) as Menu["products"];
  const categories = (snapshot.categories ?? []) as Menu["categories"];
  const sections = (snapshot.sections ?? []) as Menu["sections"];
  const productionAreas = (snapshot.productionAreas ?? []) as ProductionArea[];

  useOrdersStore.getState().setOrders(orders);
  useTablesStore.getState().setTables(tables, restaurantId);
  useMenuStore
    .getState()
    .setMenu({ sections, categories, products }, restaurantId);
  useProductionAreasStore
    .getState()
    .setProductionAreas(productionAreas, restaurantId);
}

async function applyIncremental(
  response: IncrementalSyncResponseDto,
  restaurantId: string,
) {
  const events = response.events;
  let needsMenuRefetch = false;
  let needsProductionAreasRefetch = false;

  for (const event of events) {
    applyEvent(event);

    if (
      event.resourceType === SyncResourceType.PRODUCT ||
      event.resourceType === SyncResourceType.CATEGORY ||
      event.resourceType === SyncResourceType.SECTION
    ) {
      needsMenuRefetch = true;
    }

    if (event.resourceType === SyncResourceType.PRODUCTION_AREA) {
      needsProductionAreasRefetch = true;
    }
  }

  if (needsMenuRefetch) {
    try {
      const menu = await RestaurantMenuService.getAllMenu(restaurantId);
      useMenuStore.getState().setMenu(menu, restaurantId);
    } catch (error) {
      console.error(
        "[useSync] Failed to refetch menu after sync events",
        error,
      );
    }
  }

  if (needsProductionAreasRefetch) {
    try {
      const areas = await ProductionAreasService.getAll();
      useProductionAreasStore
        .getState()
        .setProductionAreas(areas, restaurantId);
    } catch (error) {
      console.error(
        "[useSync] Failed to refetch production areas after sync events",
        error,
      );
    }
  }
}

function applyEvent(event: SyncEventDto) {
  switch (event.resourceType) {
    case SyncResourceType.ORDER:
      applyOrderEvent(event);
      break;
    case SyncResourceType.TABLE:
      applyTableEvent(event);
      break;
    case SyncResourceType.BILL:
      // Bills are nested inside orders. Legacy order websocket events and
      // ORDER sync events keep the order state up to date.
      break;
    case SyncResourceType.PRODUCT:
    case SyncResourceType.CATEGORY:
    case SyncResourceType.SECTION:
    case SyncResourceType.PRODUCTION_AREA:
    case SyncResourceType.RESTAURANT:
    case SyncResourceType.SETTINGS:
      // Handled in batch after all events are processed (menu / production
      // areas) or intentionally ignored for now (restaurant, settings).
      break;
    default:
      console.warn("[useSync] Unknown sync resource type", event.resourceType);
  }
}

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

async function applySyncResponse(
  response: SnapshotSyncResponseDto | IncrementalSyncResponseDto,
  restaurantId: string,
): Promise<number> {
  console.log("[useSync] Applying sync response", response);
  if (response.type === "snapshot") {
    applySnapshot(response, restaurantId);
    return response.sequence;
  }

  await applyIncremental(response, restaurantId);

  if (
    response.events.length === INCREMENTAL_SYNC_LIMIT &&
    response.toSequence > response.fromSequence
  ) {
    const nextResponse = await SyncService.sync(
      restaurantId,
      response.toSequence,
    );
    return applySyncResponse(nextResponse, restaurantId);
  }

  return response.toSequence;
}

export const useSync = (opts?: { showGlobalLoader?: boolean }) => {
  const { currentRestaurant } = useAuthStore();
  const setIsLoading = useGlobalStore((state) => state.setIsLoading);
  const { restaurantId, setRestaurantId, startSync, setSynced, setError } =
    useSyncStore();

  // Detect restaurant switches and reset the sync cursor so the next sync
  // starts from a fresh snapshot.
  useEffect(() => {
    if (currentRestaurant?.id && currentRestaurant.id !== restaurantId) {
      setRestaurantId(currentRestaurant.id);
    }
  }, [currentRestaurant?.id, restaurantId, setRestaurantId]);

  const syncQuery = useQuery({
    queryKey: ["sync", currentRestaurant?.id],
    queryFn: async () => {
      if (!currentRestaurant?.id) {
        throw new Error("No restaurant selected");
      }

      startSync();

      try {
        const since = useSyncStore.getState().lastSequence;
        const response = await SyncService.sync(
          currentRestaurant.id,
          since || undefined,
        );
        console.log(JSON.stringify(response, null, 2));
        const finalSequence = await applySyncResponse(
          response,
          currentRestaurant.id,
        );
        setSynced(finalSequence);
        return finalSequence;
      } catch (error) {
        setError();
        throw error;
      }
    },
    enabled: !!currentRestaurant?.id,
    staleTime: 0,
  });

  useAppForeground(() => {
    if (currentRestaurant?.id && !syncQuery.isFetching) {
      console.log("[useSync] App foregrounded, refetching sync");
      void syncQuery.refetch();
    }
  });

  useEffect(() => {
    if (opts?.showGlobalLoader) {
      setIsLoading(syncQuery.isFetching);
    }
  }, [syncQuery.isFetching, setIsLoading, opts?.showGlobalLoader]);

  return {
    syncQuery,
    isLoading: syncQuery.isLoading,
    isFetching: syncQuery.isFetching,
    refetch: syncQuery.refetch,
    isRefetching: syncQuery.isRefetching,
  };
};
