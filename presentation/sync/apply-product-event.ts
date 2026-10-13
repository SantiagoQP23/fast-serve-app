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
  const menuState = useMenuStore.getState();

  switch (event.operation) {
    case SyncOperation.CREATED:
    case SyncOperation.UPDATED: {
      const { defaultVariantId, ...data } = event.data as ProductEventData;
      const existing = menuState.products.find(
        (p) => p.id === event.resourceId,
      );

      // A partial payload can't create a product the app doesn't have yet.
      if (!existing && !data.category) return;

      let product = existing ? { ...existing, ...data } : (data as Product);
      if (defaultVariantId != null) {
        product = withDefaultOption(product, defaultVariantId);
      }

      menuState.upsertProduct(product);
      useOrdersStore.getState().updateProductInOrders(product);
      break;
    }
    case SyncOperation.DELETED:
      menuState.removeProduct(event.resourceId);
      break;
  }
}
