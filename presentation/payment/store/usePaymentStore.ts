import { generateIdempotencyKey } from "@/helpers/idempotency";
import { create } from "zustand";

interface PaymentState {
  billPaymentIdempotencyKey: string | null;
  setBillPaymentIdempotencyKey: (key: string | null) => void;
  generateBillPaymentIdempotencyKey: () => string;
  reset: () => void;
}

const initialState = {
  billPaymentIdempotencyKey: null,
};

export const usePaymentStore = create<PaymentState>((set, get) => ({
  ...initialState,
  setBillPaymentIdempotencyKey: (key: string | null) =>
    set({ billPaymentIdempotencyKey: key }),
  generateBillPaymentIdempotencyKey: () => {
    const key = generateIdempotencyKey();
    set({ billPaymentIdempotencyKey: key });
    return key;
  },
  reset: () => set(initialState),
}));
