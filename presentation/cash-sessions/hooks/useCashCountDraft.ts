import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import {
  cashCountDraftKey,
  CashCountDraft,
  CashCountDraftKind,
  useCashCountDraftStore,
} from "../store/cashCountDraftStore";

/** This user's draft key for one register screen, once all ids are known. */
export const useCashCountDraftKey = (
  kind: CashCountDraftKind,
  id: string | number | null | undefined,
) => {
  const { user, currentRestaurant } = useAuthStore();
  const validId =
    id !== null && id !== undefined && id !== "" && !Number.isNaN(id);
  return user?.id && currentRestaurant?.id && validId
    ? cashCountDraftKey(currentRestaurant.id, user.id, kind, id)
    : null;
};

/** Drafts load from storage after the first render; wait for them. */
const subscribeHydration = (onChange: () => void) =>
  useCashCountDraftStore.persist.onFinishHydration(onChange);
const getHydrated = () => useCashCountDraftStore.persist.hasHydrated();
const useDraftsHydrated = () =>
  useSyncExternalStore(subscribeHydration, getHydrated, getHydrated);

/** Whether a draft exists, e.g. to say "Continue closing". */
export const useHasCashCountDraft = (key: string | null) =>
  useCashCountDraftStore((state) => !!key && !!state.drafts[key]);

interface UseCashCountDraftOptions {
  key: string | null;
  /**
   * What to keep right now, or null while there is nothing worth keeping
   * (nothing typed yet). Saved on every change.
   */
  draft: Omit<CashCountDraft, "savedAt"> | null;
  /** Put a saved draft back on screen. Called once per key. */
  onRestore: (draft: CashCountDraft) => void;
}

/**
 * Keeps a register screen's count on this phone so leaving and coming back
 * resumes it (plans/conteo-caja-borrador.md).
 */
export const useCashCountDraft = ({
  key,
  draft,
  onRestore,
}: UseCashCountDraftOptions) => {
  const hydrated = useDraftsHydrated();
  const checkedKey = useRef<string | null>(null);
  const [restored, setRestored] = useState<CashCountDraft | null>(null);
  const onRestoreRef = useRef(onRestore);
  useEffect(() => {
    onRestoreRef.current = onRestore;
  });

  // Restore first, once per key (Open switches keys with the register).
  useEffect(() => {
    if (!hydrated || !key || checkedKey.current === key) return;
    checkedKey.current = key;
    const saved = useCashCountDraftStore.getState().drafts[key] ?? null;
    setRestored(saved);
    if (saved) onRestoreRef.current(saved);
  }, [hydrated, key]);

  const serialized = draft ? JSON.stringify(draft) : null;
  useEffect(() => {
    if (!hydrated || !key || checkedKey.current !== key || !serialized) return;
    useCashCountDraftStore.getState().save(key, JSON.parse(serialized));
  }, [hydrated, key, serialized]);

  const discard = useCallback(() => {
    if (key) useCashCountDraftStore.getState().discard(key);
    setRestored(null);
  }, [key]);

  return { restored, discard };
};
