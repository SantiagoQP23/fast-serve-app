import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { AsyncStorageAdapter } from "@/helpers/adapters/async-storage.adapter";
import type { CashCountSnapshot } from "../hooks/useCashCount";

/** Server's answer when a blind count doesn't match: the count is locked. */
export interface CashCountResult {
  expectedAmount: number | null;
  countedAmount: number | null;
  difference: number | null;
}

/**
 * A count in progress on one of the register screens, kept on this phone
 * (plans/conteo-caja-borrador.md).
 */
export interface CashCountDraft {
  count: CashCountSnapshot;
  /** The screen's step, e.g. "count" or "note". */
  step: string;
  /**
   * Set once the server compared the count with what was expected. The
   * count can't change anymore; the screen reopens on the note.
   */
  result: CashCountResult | null;
  note: string;
  /** Screen-specific bits, e.g. who the register goes to on Reassign. */
  extra?: Record<string, string | number | boolean | null>;
  savedAt: string;
}

export type CashCountDraftKind = "open" | "close" | "reassign";

/** Drafts older than this are dropped when the app starts. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * One draft per restaurant, user, screen and register, so on a shared phone
 * one cashier never gets another's count.
 */
export const cashCountDraftKey = (
  restaurantId: string | number,
  userId: string | number,
  kind: CashCountDraftKind,
  id: string | number,
) => `${restaurantId}:${userId}:${kind}:${id}`;

interface CashCountDraftState {
  drafts: Record<string, CashCountDraft>;
  save: (key: string, draft: Omit<CashCountDraft, "savedAt">) => void;
  discard: (...keys: string[]) => void;
}

export const useCashCountDraftStore = create<CashCountDraftState>()(
  persist(
    (set, get) => ({
      drafts: {},

      save: (key, draft) =>
        set({
          drafts: {
            ...get().drafts,
            [key]: { ...draft, savedAt: new Date().toISOString() },
          },
        }),

      discard: (...keys) => {
        const drafts = get().drafts;
        if (!keys.some((key) => key in drafts)) return;
        const next = { ...drafts };
        keys.forEach((key) => delete next[key]);
        set({ drafts: next });
      },
    }),
    {
      name: "cashCountDraftStore",
      storage: createJSONStorage(() => AsyncStorageAdapter),
      version: 1,
      partialize: (state) => ({ drafts: state.drafts }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const now = Date.now();
        const stale = Object.entries(state.drafts)
          .filter(([, draft]) => now - Date.parse(draft.savedAt) > MAX_AGE_MS)
          .map(([key]) => key);
        if (stale.length) state.discard(...stale);
      },
    },
  ),
);
