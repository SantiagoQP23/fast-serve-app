import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AsyncStorageAdapter } from "@/helpers/adapters/async-storage.adapter";
import { generateIdempotencyKey } from "@/helpers/idempotency";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";

export interface PurchaseCartLine {
  /** Snapshot of the item when it was added — current stock is re-read from the catalog. */
  item: InventoryItem;
  quantity: number;
}

interface PurchaseCartState {
  lines: PurchaseCartLine[];
  note: string;
  idempotencyKey: string;
}

interface PurchaseCartActions {
  /** Adds the item, or replaces its quantity when it's already in the cart. */
  setLine: (item: InventoryItem, quantity: number) => void;
  removeLine: (itemId: string) => void;
  setNote: (note: string) => void;
  reset: () => void;
}

const initialState = (): PurchaseCartState => ({
  lines: [],
  note: "",
  idempotencyKey: generateIdempotencyKey(),
});

/**
 * Draft purchase being built in the inventory module — the stock-receipt
 * counterpart of newOrderStore. Persisted so a half-built purchase
 * survives leaving the screen or restarting the app.
 */
export const usePurchaseCartStore = create<
  PurchaseCartState & PurchaseCartActions
>()(
  persist(
    (set, get) => ({
      ...initialState(),

      setLine: (item, quantity) => {
        const lines = get().lines;
        const exists = lines.some((line) => line.item.id === item.id);
        set({
          lines: exists
            ? lines.map((line) =>
                line.item.id === item.id ? { item, quantity } : line,
              )
            : [...lines, { item, quantity }],
        });
      },

      removeLine: (itemId) =>
        set({ lines: get().lines.filter((line) => line.item.id !== itemId) }),

      setNote: (note) => set({ note }),

      reset: () => set(initialState()),
    }),
    {
      name: "purchaseCartStore",
      storage: createJSONStorage(() => AsyncStorageAdapter),
    },
  ),
);
