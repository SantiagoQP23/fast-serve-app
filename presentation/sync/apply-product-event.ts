import { SyncEventDto } from "@/core/sync/dto/sync-response.dto";
import { SyncOperation } from "@/core/sync/enums/sync-operation.enum";
import { Product, withDefaultOption } from "@/core/menu/models/product.model";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";

// Some product events carry only what changed (e.g. a new default variant is
// `{ id, defaultVariantId, price }`), so they are merged into the stored
// product instead of replacing it, which would drop its category and options.
type ProductEventData = Partial<Product> & { defaultVariantId?: number };

export function applyProductEvent(event: SyncEventDto) {
  applyProductEvents([event]);
}

/**
 * Applies several product events with one update per store. A sale sends
 * one event per product whose stock changed, often dozens at once; applying
 * them one by one re-rendered and saved the menu and orders each time.
 */
export function applyProductEvents(events: SyncEventDto[]) {
  const menuState = useMenuStore.getState();
  const pending = new Map<string, Product>();
  const current = (id: string) =>
    pending.get(id) ?? menuState.products.find((p) => p.id === id);

  const flush = () => {
    if (!pending.size) return;
    const products = [...pending.values()];
    pending.clear();
    useMenuStore.getState().upsertProducts(products);
    useOrdersStore.getState().updateProductsInOrders(products);
  };

  for (const event of events) {
    switch (event.operation) {
      case SyncOperation.CREATED:
      case SyncOperation.UPDATED: {
        const { defaultVariantId, ...data } = event.data as ProductEventData;
        const existing = current(event.resourceId);

        // A partial payload can't create a product the app doesn't have yet.
        if (!existing && !data.category) break;

        let product = existing ? { ...existing, ...data } : (data as Product);
        if (defaultVariantId != null) {
          product = withDefaultOption(product, defaultVariantId);
        }

        pending.set(event.resourceId, product);
        break;
      }
      case SyncOperation.DELETED:
        flush();
        useMenuStore.getState().removeProduct(event.resourceId);
        break;
    }
  }

  flush();
}
