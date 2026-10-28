import { useContext, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useProductionAreasStore } from "@/presentation/production-areas/store/useProductionAreasStore";
import { usePaymentMethodsStore } from "@/presentation/restaurant/store/usePaymentMethodsStore";
import { useAccountsStore } from "@/presentation/restaurant/store/useAccountsStore";
import { usePrintersStore } from "@/presentation/printers/store/usePrintersStore";
import { SyncService } from "@/core/sync/services/sync.service";
import {
  SyncEventDto,
  IncrementalSyncResponseDto,
  SnapshotSyncResponseDto,
} from "@/core/sync/dto/sync-response.dto";
import { SyncOperation } from "@/core/sync/enums/sync-operation.enum";
import { SyncResourceType } from "@/core/sync/enums/sync-resource-type.enum";
import { Order } from "@/core/orders/models/order.model";
import { Table } from "@/core/tables/models/table.model";
import { Menu } from "@/core/menu/models/menu.model";
import { Category } from "@/core/menu/models/category.model";
import { Section } from "@/core/menu/models/section.model";
import { ProductionArea } from "@/core/menu/models/producion-area.model";
import { PaymentMethod } from "@/core/restaurant/models/payment-method.model";
import { Account } from "@/core/restaurant/models/account.model";
import { Printer } from "@/core/common/models/printer.model";
import { useSyncStore } from "../store/useSyncStore";
import { queryClient } from "@/app/_layout";
import { RESTAURANT_SETTINGS_QUERY_KEY } from "@/presentation/restaurant/hooks/useRestaurantSettings";
import {
  keepLocalPendingOrders,
  shouldSkipOrderSyncEvent,
} from "@/presentation/offline/pending-orders";
import { applyTicketEvent } from "../apply-ticket-event";
import { applyStockEvents } from "../apply-stock-event";
import { applyProductEvents } from "../apply-product-event";
import { applyTableAreaEvent } from "../apply-table-area-event";
import { TableArea } from "@/core/tables/models/table-area.model";
import { useUnprintedTicketsStore } from "@/presentation/orders/store/useUnprintedTicketsStore";
import { Ticket } from "@/core/tickets/models/ticket.model";
import { useAppForeground } from "@/presentation/shared/hooks/useAppForeground";
import { SocketContext } from "@/presentation/shared/context/SocketContext";
import { syncQueryKey } from "../sync-query-key";
import { onSyncApplied, resetSyncCursor } from "../sync-cursor";
import { resetAppliedSequences } from "../applied-sequences";

const INCREMENTAL_SYNC_LIMIT = 1000;

export { syncQueryKey } from "../sync-query-key";

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
  const unprintedTickets = (snapshot.unprintedTickets ?? []) as Ticket[];

  useOrdersStore.getState().setOrders(keepLocalPendingOrders(orders));
  useTablesStore.getState().setTables(tables, restaurantId);
  if (snapshot.tableAreas) {
    useTablesStore
      .getState()
      .setAreas(snapshot.tableAreas as TableArea[]);
  }
  useMenuStore
    .getState()
    .setMenu({ sections, categories, products }, restaurantId);
  useProductionAreasStore
    .getState()
    .setProductionAreas(productionAreas, restaurantId);
  useUnprintedTicketsStore.getState().setTickets(unprintedTickets);

  // The backend snapshot doesn't include payment methods, accounts or
  // printers yet. Only replace those caches when the snapshot actually
  // carries them; otherwise wiping them leaves screens that read the cache
  // (e.g. the bank account picker) with missing data.
  if (snapshot.paymentMethods) {
    usePaymentMethodsStore
      .getState()
      .setPaymentMethods(snapshot.paymentMethods as PaymentMethod[], restaurantId);
  }
  if (snapshot.accounts) {
    useAccountsStore
      .getState()
      .setAccounts(snapshot.accounts as Account[], restaurantId);
  }
  if (snapshot.printers) {
    usePrintersStore
      .getState()
      .setPrinters(snapshot.printers as Printer[], restaurantId);
  }
}

async function applyIncremental(response: IncrementalSyncResponseDto) {
  const events = response.events;
  // Runs of product updates (a sale sends one per product) go in together.
  let productRun: SyncEventDto[] = [];
  const flushProducts = () => {
    if (productRun.length) applyProductEvents(productRun);
    productRun = [];
  };

  for (const event of events) {
    if (
      event.resourceType === SyncResourceType.PRODUCT &&
      event.operation !== SyncOperation.DELETED
    ) {
      productRun.push(event);
      continue;
    }
    flushProducts();
    applyEvent(event);
  }
  flushProducts();
}

function applyEvent(event: SyncEventDto) {
  switch (event.resourceType) {
    case SyncResourceType.ORDER:
      applyOrderEvent(event);
      break;
    case SyncResourceType.TABLE:
      applyTableEvent(event);
      break;
    case SyncResourceType.TABLE_AREA:
      applyTableAreaEvent(event);
      break;
    case SyncResourceType.BILL:
      // Bills are nested inside orders. Legacy order websocket events and
      // ORDER sync events keep the order state up to date.
      break;
    case SyncResourceType.PRODUCT:
      applyProductEvents([event]);
      break;
    case SyncResourceType.CATEGORY:
      applyCategoryEvent(event);
      break;
    case SyncResourceType.SECTION:
      applySectionEvent(event);
      break;
    case SyncResourceType.PAYMENT_METHOD:
      applyPaymentMethodEvent(event);
      break;
    case SyncResourceType.ACCOUNT:
      applyAccountEvent(event);
      break;
    case SyncResourceType.PRODUCTION_AREA:
      applyProductionAreaEvent(event);
      break;
    case SyncResourceType.PRINTER:
      applyPrinterEvent(event);
      break;
    case SyncResourceType.TICKET:
      applyTicketEvent(event);
      break;
    case SyncResourceType.INVENTORY_STOCK:
      applyStockEvents([event]);
      break;
    case SyncResourceType.SETTINGS:
      // Another phone changed a setting (e.g. products without stock).
      queryClient.invalidateQueries({
        queryKey: [RESTAURANT_SETTINGS_QUERY_KEY],
      });
      break;
    case SyncResourceType.RESTAURANT:
      // Intentionally ignored for now.
      break;
    default:
      console.warn("[useSync] Unknown sync resource type", event.resourceType);
  }
}

function applyOrderEvent(event: SyncEventDto) {
  const order = event.data as Order;
  const ordersState = useOrdersStore.getState();

  // Offline changes to this order are still queued; keep the local copy.
  if (shouldSkipOrderSyncEvent(event.resourceId)) return;

  switch (event.operation) {
    case SyncOperation.CREATED:
      ordersState.addOrder(order);
      break;
    case SyncOperation.UPDATED:
      if (order.isClosed) {
        ordersState.deleteOrder(order.id);
        return;
      }
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

function applyCategoryEvent(event: SyncEventDto) {
  const menuState = useMenuStore.getState();

  switch (event.operation) {
    case SyncOperation.CREATED:
    case SyncOperation.UPDATED:
      menuState.upsertCategory(event.data as Category);
      break;
    case SyncOperation.DELETED:
      menuState.removeCategory(event.resourceId);
      break;
  }
}

function applySectionEvent(event: SyncEventDto) {
  const menuState = useMenuStore.getState();

  switch (event.operation) {
    case SyncOperation.CREATED:
    case SyncOperation.UPDATED:
      menuState.upsertSection(event.data as Section);
      break;
    case SyncOperation.DELETED:
      menuState.removeSection(event.resourceId);
      break;
  }
}

function applyPaymentMethodEvent(event: SyncEventDto) {
  const paymentMethodsState = usePaymentMethodsStore.getState();

  switch (event.operation) {
    case SyncOperation.CREATED:
    case SyncOperation.UPDATED:
      paymentMethodsState.upsertPaymentMethod(event.data as PaymentMethod);
      break;
    case SyncOperation.DELETED:
      paymentMethodsState.removePaymentMethod(Number(event.resourceId));
      break;
  }
}

function applyAccountEvent(event: SyncEventDto) {
  const accountsState = useAccountsStore.getState();

  switch (event.operation) {
    case SyncOperation.CREATED:
    case SyncOperation.UPDATED:
      accountsState.upsertAccount(event.data as Account);
      break;
    case SyncOperation.DELETED:
      accountsState.removeAccount(Number(event.resourceId));
      break;
  }
}

function applyProductionAreaEvent(event: SyncEventDto) {
  const productionAreasState = useProductionAreasStore.getState();

  switch (event.operation) {
    case SyncOperation.CREATED:
    case SyncOperation.UPDATED:
      productionAreasState.upsertProductionArea(event.data as ProductionArea);
      break;
    case SyncOperation.DELETED:
      productionAreasState.removeProductionArea(Number(event.resourceId));
      break;
  }
}

function applyPrinterEvent(event: SyncEventDto) {
  const printersState = usePrintersStore.getState();

  switch (event.operation) {
    case SyncOperation.CREATED:
    case SyncOperation.UPDATED:
      printersState.upsertPrinter(event.data as Printer);
      break;
    case SyncOperation.DELETED:
      printersState.removePrinter(event.resourceId);
      break;
  }
}

async function applySyncResponse(
  response: SnapshotSyncResponseDto | IncrementalSyncResponseDto,
  restaurantId: string,
): Promise<number> {
  console.log("[useSync] Applying sync response", response.type);
  if (response.type === "snapshot") {
    resetAppliedSequences(response.sequence);
    resetSyncCursor();
    applySnapshot(response, restaurantId);
    return response.sequence;
  }

  await applyIncremental(response);

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

export const useSync = () => {
  const { currentRestaurant } = useAuthStore();
  // Selectors, so sync status changes don't re-render every screen using it.
  const restaurantId = useSyncStore((state) => state.restaurantId);
  const setRestaurantId = useSyncStore((state) => state.setRestaurantId);
  const startSync = useSyncStore((state) => state.startSync);
  const setSynced = useSyncStore((state) => state.setSynced);
  const setError = useSyncStore((state) => state.setError);

  // Detect restaurant switches and reset the sync cursor so the next sync
  // starts from a fresh snapshot.
  useEffect(() => {
    if (currentRestaurant?.id && currentRestaurant.id !== restaurantId) {
      setRestaurantId(currentRestaurant.id);
    }
  }, [currentRestaurant?.id, restaurantId, setRestaurantId]);

  const syncQuery = useQuery({
    queryKey: syncQueryKey(currentRestaurant?.id),
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
        const finalSequence = await applySyncResponse(
          response,
          currentRestaurant.id,
        );
        setSynced(finalSequence);
        onSyncApplied(finalSequence);
        return finalSequence;
      } catch (error) {
        setError();
        throw error;
      }
    },
    enabled: !!currentRestaurant?.id,
    staleTime: 0,
  });

  // Several screens mount useSync, and each one reacts to reconnects and
  // the app coming back; cancelRefetch: false joins a sync already running
  // instead of cancelling it and starting another one per screen.
  // Catch up with what changed while the connection was down. The first
  // connection doesn't count, the initial query already covers it, unless
  // that query failed (e.g. the app opened offline).
  const { online } = useContext(SocketContext);
  const hasBeenOnlineRef = useRef(false);

  useEffect(() => {
    if (!online) return;

    const isReconnect = hasBeenOnlineRef.current;
    hasBeenOnlineRef.current = true;

    if (!currentRestaurant?.id || syncQuery.isFetching) return;

    if (isReconnect || useSyncStore.getState().status === "error") {
      void syncQuery.refetch({ cancelRefetch: false });
    }
    // Only react to connection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  useAppForeground(() => {
    if (currentRestaurant?.id && !syncQuery.isFetching) {
      void syncQuery.refetch({ cancelRefetch: false });
    }
  });

  return {
    syncQuery,
    isLoading: syncQuery.isLoading,
    isFetching: syncQuery.isFetching,
    refetch: syncQuery.refetch,
    isRefetching: syncQuery.isRefetching,
  };
};
