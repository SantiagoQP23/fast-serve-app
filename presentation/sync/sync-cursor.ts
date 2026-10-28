import { useSyncStore } from "./store/useSyncStore";
import { requestSync } from "./request-sync";

// Live events arrived above the cursor with a hole before them.
const seenAhead = new Set<number>();

/**
 * Moves the sync cursor past live events, but only while the numbers
 * follow on from it. When one is missing (a socket message lost, or two
 * requests finishing out of order) the cursor stays before the hole and
 * an incremental sync fetches what's missing, instead of jumping past it
 * and never asking for those events again.
 */
export function advanceSyncCursor(sequences: number[]) {
  const syncState = useSyncStore.getState();
  let last = syncState.lastSequence;
  // No cursor yet: the first sync sets it.
  if (!last) return;

  for (const sequence of sequences)
    if (sequence > last) seenAhead.add(sequence);
  while (seenAhead.delete(last + 1)) last++;

  if (last !== syncState.lastSequence) syncState.setSynced(last);
  if (seenAhead.size) requestSync();
}

/** After a sync: forget what it covered, and sync again if a hole is left. */
export function onSyncApplied(sequence: number) {
  for (const seen of seenAhead) if (seen <= sequence) seenAhead.delete(seen);
  if (seenAhead.size) requestSync();
}

export function resetSyncCursor() {
  seenAhead.clear();
}
