import { create } from "zustand";
import {
  OrderDetail,
  OrderDetailStatus,
} from "@/core/orders/models/order-detail.model";
import {
  getUnbilledQty,
  roundQty,
  shareQuantity,
} from "@/core/orders/utils/bill-split.util";

export const MAX_SPLIT_PEOPLE = 20;
export const MIN_SPLIT_PEOPLE = 2;

export interface SplitPerson {
  key: number;
  label: string;
}

/** Units of one item shared equally between some people. */
export interface SplitShare {
  units: number;
  people: number[];
}

/**
 * The split being built for one order: its people, what each has on their
 * own and what's shared. Lives while the split screen and its per-person
 * screen are open; not persisted, so a split left halfway is gone.
 */
interface SplitBillState {
  orderId: string | null;
  people: SplitPerson[];
  nextKey: number;
  // person key -> order detail id -> units for that person alone
  own: Record<number, Record<string, number>>;
  // order detail id -> units shared equally
  shared: Record<string, SplitShare>;
  // Adding, removing or renaming people counts as a change worth keeping.
  peopleEdited: boolean;
  start: (orderId: string, labels: string[]) => void;
  addPerson: (label: string) => number | null;
  removePerson: (key: number) => void;
  renamePerson: (key: number, label: string) => void;
  setOwnQty: (key: number, detailId: string, qty: number) => void;
  setShare: (detailId: string, share: SplitShare) => void;
  unshare: (detailId: string) => void;
  reset: () => void;
}

const initialState = {
  orderId: null,
  people: [],
  nextKey: 0,
  own: {},
  shared: {},
  peopleEdited: false,
};

export const useSplitBillStore = create<SplitBillState>()((set, get) => ({
  ...initialState,
  start: (orderId, labels) =>
    set({
      ...initialState,
      orderId,
      people: labels.map((label, key) => ({ key, label })),
      nextKey: labels.length,
    }),
  addPerson: (label) => {
    const { people, nextKey } = get();
    if (people.length >= MAX_SPLIT_PEOPLE) return null;
    set({
      people: [...people, { key: nextKey, label }],
      nextKey: nextKey + 1,
      peopleEdited: true,
    });
    return nextKey;
  },
  removePerson: (key) => {
    const { people, own, shared } = get();
    if (people.length <= MIN_SPLIT_PEOPLE) return;
    const { [key]: _removed, ...restOwn } = own;
    set({
      people: people.filter((p) => p.key !== key),
      own: restOwn,
      // A share needs two people; with fewer its units go back to unassigned.
      shared: Object.fromEntries(
        Object.entries(shared)
          .map(
            ([id, share]) =>
              [
                id,
                { ...share, people: share.people.filter((p) => p !== key) },
              ] as const,
          )
          .filter(([, share]) => share.people.length >= MIN_SPLIT_PEOPLE),
      ),
      peopleEdited: true,
    });
  },
  renamePerson: (key, label) =>
    set((state) => ({
      people: state.people.map((p) => (p.key === key ? { ...p, label } : p)),
      peopleEdited: true,
    })),
  setOwnQty: (key, detailId, qty) =>
    set((state) => ({
      own: {
        ...state.own,
        [key]: { ...state.own[key], [detailId]: roundQty(qty) },
      },
    })),
  setShare: (detailId, share) =>
    set((state) => ({ shared: { ...state.shared, [detailId]: share } })),
  unshare: (detailId) =>
    set((state) => {
      const { [detailId]: _removed, ...rest } = state.shared;
      return { shared: rest };
    }),
  reset: () => set(initialState),
}));

type SplitDraft = Pick<SplitBillState, "own" | "shared">;

/** Units of an item nobody has yet. */
export const getUnassignedQty = (draft: SplitDraft, detail: OrderDetail) => {
  const ownTotal = Object.values(draft.own).reduce(
    (acc, items) => acc + (items[detail.id] ?? 0),
    0,
  );
  return Math.max(
    roundQty(
      getUnbilledQty(detail) - ownTotal - (draft.shared[detail.id]?.units ?? 0),
    ),
    0,
  );
};

/** What one person gets of an item: own units plus their share. */
export const getPersonQty = (
  draft: SplitDraft,
  personKey: number,
  detailId: string,
) => {
  const mine = draft.own[personKey]?.[detailId] ?? 0;
  const share = draft.shared[detailId];
  if (!share) return mine;
  const index = share.people.indexOf(personKey);
  if (index === -1) return mine;
  return roundQty(
    mine + shareQuantity(share.units, share.people.length)[index],
  );
};

export const getPersonTotal = (
  draft: SplitDraft,
  personKey: number,
  details: OrderDetail[],
) =>
  details.reduce(
    (acc, detail) =>
      acc + getPersonQty(draft, personKey, detail.id) * detail.price,
    0,
  );

/** Order lines that can still go on a bill. */
export const getSplittableDetails = (details: OrderDetail[] = []) =>
  details.filter(
    (detail) =>
      detail.status !== OrderDetailStatus.CANCELLED &&
      getUnbilledQty(detail) > 0,
  );

/** "Arroz con camarón", plus the variant when the product has several. */
export const getSplitDetailName = (detail: OrderDetail) =>
  detail.product.options.length > 1 && detail.productOption
    ? `${detail.product.name} ${detail.productOption.name}`
    : detail.product.name;
