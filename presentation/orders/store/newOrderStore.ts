import { NewOrderDetail } from "@/core/orders/dto/new-order-detail.dto";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { Table } from "@/core/tables/models/table.model";
import { create } from "zustand";
import { createJSONStorage, persist, PersistStorage } from "zustand/middleware";
import { AsyncStorageAdapter } from "@/helpers/adapters/async-storage.adapter";
import { generateIdempotencyKey } from "@/helpers/idempotency";
import { isSameOrderLine } from "@/presentation/orders/utils/same-order-line";

export type CartType = "order" | "sale";

/** Lines and key of the draft the cart isn't showing right now. */
export interface ParkedDraft {
  details: NewOrderDetail[];
  idempotencyKey: string;
}

/**
 * Two drafts live here: a new order and a new direct sale. `cartType` says
 * which one the cart shows; its lines and key are `details` and
 * `idempotencyKey`, and the other draft's wait in `parked`. The order fields
 * (table, type, people, notes, delivery time) always belong to the order
 * draft, whichever is showing, since a sale has none.
 */
export interface NewOrderState {
  cartType: CartType;
  parked: ParkedDraft;
  table: Table | null;
  amount: number;
  details: NewOrderDetail[];
  people: number;
  orderType: OrderType;
  totalProducts: number;
  notes: string;
  deliveryTime: Date | null;
  activeDetail: NewOrderDetail | null;
  idempotencyKey: string;
}

interface NewOrderActions {
  setTable: (table: Table | null) => void;
  setAmount: (amount: number) => void;
  setDetails: (details: NewOrderDetail[]) => void;
  setPeople: (people: number) => void;
  setOrderType: (orderType: OrderType) => void;
  setTotalProducts: (totalProducts: number) => void;
  setNotes: (notes: string) => void;
  setDeliveryTime: (deliveryTime: Date | null) => void;
  /** Adds the line, or raises the quantity of an identical one. Returns its id. */
  addDetail: (detail: NewOrderDetail) => string;
  removeDetail: (detail: NewOrderDetail) => void;
  updateDetail: (detail: NewOrderDetail) => void;
  setActiveDetail: (detail: NewOrderDetail | null) => void;

  /** Shows the order or the sale draft in the cart, keeping both. */
  openDraft: (type: CartType) => void;
  /**
   * Moves the shown draft's lines into the other draft, combined with its
   * lines or replacing them, and shows that draft. Lines moving into the
   * order take its current type. The source draft is left empty.
   */
  convertTo: (type: CartType, mode: "merge" | "replace") => void;
  /** Lines in a draft, whichever one is showing. */
  getDraftDetails: (type: CartType) => NewOrderDetail[];
  /** Empties one draft (the shown one by default). */
  reset: (type?: CartType) => void;
  /** Empties both drafts, e.g. when switching restaurant. */
  resetAll: () => void;
}

const orderFields = () => ({
  table: null,
  people: 0,
  orderType: OrderType.IN_PLACE,
  notes: "",
  deliveryTime: null,
});

const emptyParked = (): ParkedDraft => ({
  details: [],
  idempotencyKey: generateIdempotencyKey(),
});

/** Adds `lines` onto `details`, raising the quantity of identical ones. */
const mergeLines = (details: NewOrderDetail[], lines: NewOrderDetail[]) =>
  lines.reduce((acc, line) => {
    const existing = acc.find((d) => isSameOrderLine(d, line));
    return existing
      ? acc.map((d) =>
          d === existing ? { ...d, quantity: d.quantity + line.quantity } : d,
        )
      : [...acc, line];
  }, details);

const initialState: NewOrderState = {
  cartType: "order",
  parked: emptyParked(),
  details: [],
  amount: 0,
  table: null,
  people: 0,
  orderType: OrderType.IN_PLACE,
  totalProducts: 0,
  notes: "",
  deliveryTime: null,
  activeDetail: null,
  idempotencyKey: generateIdempotencyKey(),
};

export const useNewOrderStore = create<NewOrderState & NewOrderActions>()(
  persist(
    (set, get) => ({
      title: "New Order",
      ...initialState,

      setTable: (table: Table | null) => set({ table }),
      setAmount: (amount: number) => set({ amount }),
      setDetails: (details: NewOrderDetail[]) => set({ details }),

      addDetail: (detail: NewOrderDetail) => {
        const details = get().details;
        const line = {
          ...detail,
          typeOrderDetail: detail.typeOrderDetail ?? get().orderType,
        };
        const existing = details.find((d) => isSameOrderLine(d, line));
        if (existing?.id) {
          set({
            details: details.map((d) =>
              d === existing
                ? { ...d, quantity: d.quantity + line.quantity }
                : d,
            ),
          });
          return existing.id;
        }
        const id = Math.random().toString(36).slice(2);
        set({ details: [...details, { ...line, id }] });
        return id;
      },

      removeDetail: (detail: NewOrderDetail) => {
        const details = get().details;
        set({
          details: details.filter((d) =>
            detail.id ? d.id !== detail.id : d.product.id !== detail.product.id,
          ),
        });
      },

      updateDetail: (detail: NewOrderDetail) => {
        const details = get().details;
        set({
          details: details.map((d) =>
            (
              detail.id
                ? d.id === detail.id
                : d.product.id === detail.product.id
            )
              ? {
                  ...d,
                  quantity: detail.quantity,
                  description: detail.description,
                  price: detail.price,
                  tagIds: detail.tagIds,
                  productOption: detail.productOption,
                  typeOrderDetail: detail.typeOrderDetail,
                }
              : d,
          ),
        });
      },

      setPeople: (people: number) => set({ people }),
      setOrderType: (orderType: OrderType) => set({ orderType }),
      setTotalProducts: (totalProducts: number) => set({ totalProducts }),
      setNotes: (notes: string) => set({ notes }),
      setDeliveryTime: (deliveryTime: Date | null) => set({ deliveryTime }),
      setActiveDetail: (activeDetail: NewOrderDetail | null) =>
        set({ activeDetail }),

      openDraft: (type: CartType) => {
        const { cartType, details, idempotencyKey, parked } = get();
        if (type === cartType) return;
        set({
          cartType: type,
          details: parked.details,
          idempotencyKey: parked.idempotencyKey,
          parked: { details, idempotencyKey },
          activeDetail: null,
        });
      },

      convertTo: (type: CartType, mode: "merge" | "replace") => {
        const { cartType, details, parked, orderType } = get();
        if (type === cartType) return;
        const moving =
          type === "order"
            ? details.map((d) => ({ ...d, typeOrderDetail: orderType }))
            : details;
        set({
          cartType: type,
          details:
            mode === "merge" ? mergeLines(parked.details, moving) : moving,
          idempotencyKey: parked.idempotencyKey,
          parked: emptyParked(),
          activeDetail: null,
          // The order moved out: start the next one clean.
          ...(cartType === "order" ? orderFields() : {}),
        });
      },

      getDraftDetails: (type: CartType) =>
        type === get().cartType ? get().details : get().parked.details,

      reset: (type?: CartType) => {
        const { cartType } = get();
        const target = type ?? cartType;
        const cleared =
          target === "order" ? orderFields() : ({} as Partial<NewOrderState>);
        if (target === cartType)
          set({
            ...cleared,
            details: [],
            idempotencyKey: generateIdempotencyKey(),
            activeDetail: null,
          });
        else set({ ...cleared, parked: emptyParked() });
      },

      resetAll: () =>
        set({
          ...initialState,
          parked: emptyParked(),
          idempotencyKey: generateIdempotencyKey(),
        }),
    }),
    {
      name: "newOrderStore",
      // storage: () => SecureStorageAdapter,
      storage: createJSONStorage(() => AsyncStorageAdapter),
      // v0 kept one draft: it stays the shown one and the other starts empty.
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as Partial<NewOrderState>;
        if (version < 1) return { ...state, parked: emptyParked() };
        return state;
      },
    },
  ),
);

/** Selects the lines of one draft, whichever one the cart is showing. */
export const selectDraftDetails = (type: CartType) => (state: NewOrderState) =>
  state.cartType === type ? state.details : state.parked.details;
