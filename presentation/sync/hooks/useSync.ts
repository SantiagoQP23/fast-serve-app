import { useEffect } from "react";
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
import { Product } from "@/core/menu/models/product.model";
import { Category } from "@/core/menu/models/category.model";
import { Section } from "@/core/menu/models/section.model";
import { ProductionArea } from "@/core/menu/models/producion-area.model";
import { PaymentMethod } from "@/core/restaurant/models/payment-method.model";
import { Account } from "@/core/restaurant/models/account.model";
import { Printer } from "@/core/common/models/printer.model";
import { useSyncStore } from "../store/useSyncStore";
import { applyTicketEvent } from "../apply-ticket-event";
import { useUnprintedTicketsStore } from "@/presentation/orders/store/useUnprintedTicketsStore";
import { Ticket } from "@/core/tickets/models/ticket.model";
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
  const paymentMethods = (snapshot.paymentMethods ?? []) as PaymentMethod[];
  const accounts = (snapshot.accounts ?? []) as Account[];
  const printers = (snapshot.printers ?? []) as Printer[];
  const unprintedTickets = (snapshot.unprintedTickets ?? []) as Ticket[];

  useOrdersStore.getState().setOrders(orders);
  useTablesStore.getState().setTables(tables, restaurantId);
  useMenuStore
    .getState()
    .setMenu({ sections, categories, products }, restaurantId);
  useProductionAreasStore
    .getState()
    .setProductionAreas(productionAreas, restaurantId);
  usePaymentMethodsStore
    .getState()
    .setPaymentMethods(paymentMethods, restaurantId);
  useAccountsStore.getState().setAccounts(accounts, restaurantId);
  usePrintersStore.getState().setPrinters(printers, restaurantId);
  useUnprintedTicketsStore.getState().setTickets(unprintedTickets);
}

async function applyIncremental(response: IncrementalSyncResponseDto) {
  const events = response.events;

  for (const event of events) {
    console.log(
      "[useSync] Applying sync event",
      event.resourceType,
      event.operation,
    );
    applyEvent(event);
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
      applyProductEvent(event);
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
    case SyncResourceType.RESTAURANT:
    case SyncResourceType.SETTINGS:
      // Intentionally ignored for now.
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
      console.log("[useSync] Order updated", order.id, order.status);
      if (order.isClosed) {
        console.log("[useSync] Order closed, removing from state", order.id);
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

function applyProductEvent(event: SyncEventDto) {
  const menuState = useMenuStore.getState();

  switch (event.operation) {
    case SyncOperation.CREATED:
    case SyncOperation.UPDATED:
      const product = event.data as Product;
      menuState.upsertProduct(product);
      useOrdersStore.getState().updateProductInOrders(product);
      break;
    case SyncOperation.DELETED:
      menuState.removeProduct(event.resourceId);
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

  return {
    syncQuery,
    isLoading: syncQuery.isLoading,
    isFetching: syncQuery.isFetching,
    refetch: syncQuery.refetch,
    isRefetching: syncQuery.isRefetching,
  };
};
