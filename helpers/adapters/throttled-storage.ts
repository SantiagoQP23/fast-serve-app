import { AppState } from "react-native";
import type { PersistStorage, StorageValue } from "zustand/middleware";
import { AsyncStorageAdapter } from "./async-storage.adapter";

/**
 * Persist storage for big stores that change often (orders, menu, sync…).
 *
 * zustand's JSON storage serializes and writes the whole store on every
 * set(), so a burst of sync events or typing a discount rewrote every open
 * order to AsyncStorage each time. This keeps only the latest value per
 * store and writes all pending stores together at most once per interval,
 * and right away when the app goes to the background.
 *
 * Writing every pending store in the same flush keeps them consistent with
 * each other (e.g. the sync store's lastSequence never gets ahead of the
 * orders it describes). Don't use it for stores that must survive a crash
 * the moment they change, like the offline outbox.
 */
const FLUSH_INTERVAL_MS = 1000;

const pending = new Map<string, StorageValue<unknown>>();
let timer: ReturnType<typeof setTimeout> | null = null;

const flush = async () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const entries = Array.from(pending.entries());
  pending.clear();
  await Promise.all(
    entries.map(([name, value]) =>
      AsyncStorageAdapter.setItem(name, JSON.stringify(value)),
    ),
  );
};

AppState.addEventListener("change", (state) => {
  if (state !== "active" && pending.size > 0) void flush();
});

export const flushThrottledStorage = flush;

export const createThrottledStorage = <S>(): PersistStorage<S> => ({
  getItem: async (name) => {
    // A value not written yet is newer than the one on disk.
    if (pending.has(name)) return pending.get(name) as StorageValue<S>;
    const str = await AsyncStorageAdapter.getItem(name);
    return str ? (JSON.parse(str) as StorageValue<S>) : null;
  },
  setItem: (name, value) => {
    pending.set(name, value as StorageValue<unknown>);
    if (!timer) timer = setTimeout(() => void flush(), FLUSH_INTERVAL_MS);
  },
  removeItem: async (name) => {
    pending.delete(name);
    await AsyncStorageAdapter.removeItem(name);
  },
});
