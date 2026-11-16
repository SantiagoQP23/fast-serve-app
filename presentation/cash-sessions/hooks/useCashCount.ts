import { useCallback, useState } from "react";

import { CashCountLine } from "@/core/cash-sessions/models/cash-session.model";
import { parseAmount } from "@/core/orders/utils/bill-payment.util";
import {
  CashCountQuantities,
  fromCashCountLines,
  getCashCountTotal,
  toCashCountLines,
} from "@/core/cash-sessions/utils/cash-count.util";

export type CashCountMode = "count" | "amount";

/**
 * Cash typed bill by bill ("count") or as one total ("amount"). `value` is
 * what gets sent; `breakdown` only exists when counting.
 */
export const useCashCount = () => {
  const [mode, setMode] = useState<CashCountMode>("count");
  const [quantities, setQuantities] = useState<CashCountQuantities>({});
  const [amount, setAmount] = useState("");

  const setQuantity = useCallback((value: number, text: string) => {
    setQuantities((prev) => ({ ...prev, [value]: text.replace(/\D/g, "") }));
  }, []);

  /**
   * Prefill from a previous count: its bills when it has them, otherwise its
   * total. With neither, an empty counter.
   */
  const reset = useCallback(
    (prefill?: { breakdown?: CashCountLine[] | null; amount?: string }) => {
      const hasBreakdown = !!prefill?.breakdown?.length;
      setMode(hasBreakdown || !prefill?.amount ? "count" : "amount");
      setQuantities(fromCashCountLines(prefill?.breakdown));
      setAmount(prefill?.amount ?? "");
    },
    [],
  );

  const total = getCashCountTotal(quantities);
  const value = mode === "count" ? total : parseAmount(amount);
  const breakdown = mode === "count" ? toCashCountLines(quantities) : undefined;
  /** Nothing typed yet in the current mode. */
  const isEmpty = mode === "count" ? !breakdown?.length : amount.trim() === "";

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
    reset,
  };
};

export type CashCountState = ReturnType<typeof useCashCount>;
