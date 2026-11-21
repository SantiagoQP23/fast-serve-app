import { useCallback, useState } from "react";

import { CashCountLine } from "@/core/cash-sessions/models/cash-session.model";
import { parseAmount } from "@/core/orders/utils/bill-payment.util";
import {
  CashCountQuantities,
  fromCashCountLines,
  getCashCountTotal,
  MAX_CASH_QUANTITY,
  toCashCountLines,
} from "@/core/cash-sessions/utils/cash-count.util";

export type CashCountMode = "count" | "amount";

/** What a count draft keeps of the count itself. */
export interface CashCountSnapshot {
  mode: CashCountMode;
  quantities: CashCountQuantities;
  amount: string;
}

/**
 * Cash typed bill by bill ("count") or as one total ("amount"). `value` is
 * what gets sent; `breakdown` only exists when counting. `touched` turns on
 * with the first change by hand, so a prefill alone isn't saved as a draft.
 */
export const useCashCount = () => {
  const [mode, setModeState] = useState<CashCountMode>("count");
  const [quantities, setQuantities] = useState<CashCountQuantities>({});
  const [amount, setAmountState] = useState("");
  const [touched, setTouched] = useState(false);

  const setMode = useCallback((next: CashCountMode) => {
    setModeState(next);
    setTouched(true);
  }, []);

  const setAmount = useCallback((text: string) => {
    setAmountState(text);
    setTouched(true);
  }, []);

  const setQuantity = useCallback((value: number, quantity: number) => {
    const n = Number.isFinite(quantity)
      ? Math.min(Math.max(Math.floor(quantity), 0), MAX_CASH_QUANTITY)
      : 0;
    setQuantities((prev) => ({ ...prev, [value]: n }));
    setTouched(true);
  }, []);

  /**
   * Prefill from a previous count: its bills when it has them, otherwise its
   * total. With neither, an empty counter.
   */
  const reset = useCallback(
    (prefill?: { breakdown?: CashCountLine[] | null; amount?: string }) => {
      const hasBreakdown = !!prefill?.breakdown?.length;
      setModeState(hasBreakdown || !prefill?.amount ? "count" : "amount");
      setQuantities(fromCashCountLines(prefill?.breakdown));
      setAmountState(prefill?.amount ?? "");
      setTouched(false);
    },
    [],
  );

  /** Back to a saved draft, which counts as typed by hand. */
  const restore = useCallback((snapshot: CashCountSnapshot) => {
    setModeState(snapshot.mode);
    setQuantities(snapshot.quantities ?? {});
    setAmountState(snapshot.amount ?? "");
    setTouched(true);
  }, []);

  const total = getCashCountTotal(quantities);
  const value = mode === "count" ? total : parseAmount(amount);
  const breakdown = mode === "count" ? toCashCountLines(quantities) : undefined;
  /** Nothing typed yet in the current mode. */
  const isEmpty = mode === "count" ? !breakdown?.length : amount.trim() === "";
  const snapshot: CashCountSnapshot = { mode, quantities, amount };

  return {
    mode,
    setMode,
    quantities,
    setQuantity,
    amount,
    setAmount,
    total,
    value,
    breakdown,
    isEmpty,
    touched,
    snapshot,
    reset,
    restore,
  };
};

export type CashCountState = ReturnType<typeof useCashCount>;
