import { create } from "zustand";

interface SheetToasterState {
  /** Number of open native sheets currently hosting their own toaster. */
  hostCount: number;
  registerHost: () => void;
  unregisterHost: () => void;
}

/**
 * Tracks the sheets that render their own toaster, so the root toaster can
 * step aside while one is open (toasts live in a single global store, and two
 * mounted toasters would both draw them).
 */
export const useSheetToasterStore = create<SheetToasterState>()((set) => ({
  hostCount: 0,
  registerHost: () => set((state) => ({ hostCount: state.hostCount + 1 })),
  unregisterHost: () =>
    set((state) => ({ hostCount: Math.max(0, state.hostCount - 1) })),
}));
