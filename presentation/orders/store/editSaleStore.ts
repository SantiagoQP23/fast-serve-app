import { create } from "zustand";
import { Bill } from "@/core/orders/models/bill.model";
import { Product } from "@/core/menu/models/product.model";
import { ProductOption } from "@/core/menu/models/product-optionl.model";

export interface EditSaleLine {
  /** Stable key for lists: the bill line id, or a local id for new lines. */
  key: string;
  billDetailId?: number;
  product?: Product;
  productOption?: ProductOption;
  price: number;
  quantity: number;
}

/**
 * Lines of a direct sale being edited. Shared by the edit-sale screen and the
 * restaurant menu, which adds products here instead of the cart while
 * `billId` is set. Not persisted: an interrupted edit simply isn't saved.
 */
interface EditSaleState {
  billId: number | null;
  billNum: number | null;
  lines: EditSaleLine[];
  init: (bill: Bill) => void;
  addLine: (line: Omit<EditSaleLine, "key" | "billDetailId">) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  reset: () => void;
}

let localId = 0;

export const useEditSaleStore = create<EditSaleState>()((set) => ({
  billId: null,
  billNum: null,
  lines: [],

  init: (bill) =>
    set({
      billId: bill.id,
      billNum: bill.num,
      lines: bill.details.map((detail) => ({
        key: `bill-${detail.id}`,
        billDetailId: detail.id,
        product: detail.product,
        productOption: detail.productOption,
        price: detail.price,
        quantity: detail.quantity,
      })),
    }),

  addLine: (line) =>
    set((state) => {
      // The same product, variant and price added twice is one new line.
      const existing = state.lines.find(
        (l) =>
          !l.billDetailId &&
          l.productOption?.id === line.productOption?.id &&
          l.price === line.price,
      );
      if (existing)
        return {
          lines: state.lines.map((l) =>
            l === existing ? { ...l, quantity: l.quantity + line.quantity } : l,
          ),
        };
      return {
        lines: [...state.lines, { ...line, key: `new-${++localId}` }],
      };
    }),

  setQuantity: (key, quantity) =>
    set((state) => ({
      lines: state.lines.map((l) => (l.key === key ? { ...l, quantity } : l)),
    })),

  removeLine: (key) =>
    set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),

  reset: () => set({ billId: null, billNum: null, lines: [] }),
}));
