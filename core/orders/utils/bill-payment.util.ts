import { roundTo } from "@/core/common/utils/format.util";
import { TransactionStatus } from "@/core/transactions/models/transaction-status.enum";
import { Bill } from "../models/bill.model";

// Payments that already count against the bill: completed ones, plus transfers
// still waiting on proof or approval. Charging those again would overpay the
// bill once they're approved, so they're held back from the amount due.
const COMMITTED_STATUSES = new Set<TransactionStatus>([
  TransactionStatus.COMPLETED,
  TransactionStatus.PENDING_PROOF,
  TransactionStatus.PENDING_APPROVAL,
]);

/** Money already paid (or on its way) towards the bill. */
export const getBillCommittedAmount = (bill: Bill): number =>
  roundTo(
    (bill.transactions ?? []).reduce(
      (sum, t) =>
        COMMITTED_STATUSES.has(t.status) ? sum + Number(t.amount) : sum,
      0,
    ),
    2,
  );

/**
 * What's left to charge on the bill. `bill.total` already has the discount
 * applied by the server, so it must not be subtracted again.
 */
export const getBillAmountDue = (bill: Bill): number =>
  Math.max(0, roundTo(Number(bill.total) - getBillCommittedAmount(bill), 2));

/** What the customer pays when the method adds a commission (cards). */
export const applyCommission = (
  amount: number,
  commissionPercentage: number,
): number => roundTo(amount * (1 + commissionPercentage / 100), 2);

/**
 * Parses a typed money amount. Accepts a comma as the decimal separator
 * ("12,50") since that's what many keyboards offer. Returns NaN for anything
 * that isn't a plain non-negative number.
 */
export const parseAmount = (text: string | null | undefined): number => {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return NaN;

  const normalized = trimmed.includes(".")
    ? trimmed.replace(/,/g, "")
    : trimmed.replace(",", ".");
  if (!/^\d*\.?\d*$/.test(normalized)) return NaN;

  const value = Number(normalized);
  return Number.isFinite(value) ? value : NaN;
};

/** Two amounts are the same to the cent. */
export const isSameAmount = (a: number, b: number): boolean =>
  Math.abs(a - b) < 0.005;

// Note and coin multiples a customer is likely to hand over.
const CASH_TENDER_STEPS = [5, 10, 20, 50, 100];

/**
 * Round amounts a customer is likely to pay with for `amount`, smallest
 * first, never the exact amount itself (that's its own option). $23.40 →
 * $25, $30, $40.
 */
export const getCashTenderSuggestions = (amount: number, max = 3): number[] => {
  if (!(amount > 0)) return [];
  const suggestions = new Set<number>();
  for (const step of CASH_TENDER_STEPS) {
    const rounded = Math.ceil(amount / step) * step;
    if (!isSameAmount(rounded, amount)) suggestions.add(rounded);
  }
  return [...suggestions].sort((a, b) => a - b).slice(0, max);
};
