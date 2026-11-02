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

export interface PurchaseDraft {
  id: string;
  lines: PurchaseCartLine[];
  note: string;
  idempotencyKey: string;
  createdAt: string;
}

interface PurchaseCartState {
  drafts: PurchaseDraft[];
}

interface PurchaseCartActions {
  /**
   * Adds the item to the draft, or replaces its quantity when it's already
   * there. Creates the draft on its first write.
   */
  setLine: (draftId: string, item: InventoryItem, quantity: number) => void;
  /** Removes the item; a draft left with no lines and no note is dropped. */
  removeLine: (draftId: string, itemId: string) => void;
  setNote: (draftId: string, note: string) => void;
  /** Sets several lines at once, creating the draft if needed. */
  fillDraft: (draftId: string, lines: PurchaseCartLine[]) => void;
  discard: (draftId: string) => void;
}

/** Id for a draft that doesn't exist yet — it's stored on its first write. */
export const newPurchaseDraftId = generateIdempotencyKey;

const createDraft = (id: string): PurchaseDraft => ({
  id,
  lines: [],
  note: "",
  idempotencyKey: generateIdempotencyKey(),
  createdAt: new Date().toISOString(),
});

const upsertLine = (
  lines: PurchaseCartLine[],
  item: InventoryItem,
  quantity: number,
): PurchaseCartLine[] =>
  lines.some((line) => line.item.id === item.id)
    ? lines.map((line) =>
        line.item.id === item.id ? { item, quantity } : line,
      )
    : [...lines, { item, quantity }];

/**
 * Draft purchases being built in the inventory module — the stock-receipt
 * counterpart of newOrderStore. Persisted so half-built purchases survive
 * leaving the screen or restarting the app.
 */
export const usePurchaseCartStore = create<
  PurchaseCartState & PurchaseCartActions
>()(
  persist(
    (set, get) => {
      const updateDraft = (
        draftId: string,
        update: (draft: PurchaseDraft) => PurchaseDraft,
      ) => {
        const drafts = get().drafts;
        const existing = drafts.find((draft) => draft.id === draftId);
        set({
          drafts: existing
            ? drafts.map((draft) =>
                draft.id === draftId ? update(draft) : draft,
              )
            : [...drafts, update(createDraft(draftId))],
        });
      };

      return {
        drafts: [],

        setLine: (draftId, item, quantity) =>
          updateDraft(draftId, (draft) => ({
            ...draft,
            lines: upsertLine(draft.lines, item, quantity),
          })),

        removeLine: (draftId, itemId) =>
          set({
            drafts: get().drafts.flatMap((draft) => {
              if (draft.id !== draftId) return [draft];
              const lines = draft.lines.filter(
                (line) => line.item.id !== itemId,
              );
              return lines.length === 0 && !draft.note.trim()
                ? []
                : [{ ...draft, lines }];
            }),
          }),

        setNote: (draftId, note) =>
          updateDraft(draftId, (draft) => ({ ...draft, note })),

        fillDraft: (draftId, lines) =>
          updateDraft(draftId, (draft) => ({
            ...draft,
            lines: lines.reduce(
              (acc, line) => upsertLine(acc, line.item, line.quantity),
              draft.lines,
            ),
          })),

        discard: (draftId) =>
          set({ drafts: get().drafts.filter((draft) => draft.id !== draftId) }),
      };
    },
    {
      name: "purchaseCartStore",
      storage: createJSONStorage(() => AsyncStorageAdapter),
      version: 1,
      // v0 held a single draft at the top level
      migrate: (persisted, version) => {
        if (version === 0) {
          const old = persisted as {
            lines?: PurchaseCartLine[];
            note?: string;
            idempotencyKey?: string;
          };
          const lines = old?.lines ?? [];
          return {
            drafts:
              lines.length > 0
                ? [
                    {
                      ...createDraft(generateIdempotencyKey()),
                      lines,
                      note: old.note ?? "",
                      idempotencyKey:
                        old.idempotencyKey ?? generateIdempotencyKey(),
                    },
                  ]
                : [],
          };
        }
        return persisted as PurchaseCartState;
      },
    },
  ),
);

const EMPTY_LINES: PurchaseCartLine[] = [];

/** Lines and note of one draft; empty while it hasn't been stored yet. */
export const usePurchaseDraft = (draftId: string) => {
  const draft = usePurchaseCartStore((state) =>
    state.drafts.find((d) => d.id === draftId),
  );
  return {
    draft,
    lines: draft?.lines ?? EMPTY_LINES,
    note: draft?.note ?? "",
  };
};
