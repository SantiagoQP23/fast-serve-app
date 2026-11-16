import { formatCurrency } from "@/core/i18n/utils";
import { CashCountLine } from "../models/cash-session.model";

/** Bills and coins the counter lists, largest first. */
export const CASH_DENOMINATIONS = [
  100, 50, 20, 10, 5, 1, 0.5, 0.25, 0.1, 0.05, 0.01,
] as const;

/** "$20" for bills and whole coins, "$0.25" for cents. */
export const formatDenomination = (value: number) =>
  formatCurrency(value).replace(/\.00$/, "");

/** Quantity typed per denomination, keyed by its value. */
export type CashCountQuantities = Record<number, string>;

const toQuantity = (text: string | undefined) => {
  const n = parseInt(text ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** In cents, so $0.50 × 3 is exactly $1.50. */
const lineCents = (value: number, quantity: number) =>
  Math.round(value * 100) * quantity;

export const getCashCountSubtotal = (value: number, text: string | undefined) =>
  lineCents(value, toQuantity(text)) / 100;

export const getCashCountTotal = (quantities: CashCountQuantities) =>
  CASH_DENOMINATIONS.reduce(
    (cents, value) => cents + lineCents(value, toQuantity(quantities[value])),
    0,
  ) / 100;

/** The lines to save: only denominations that were counted. */
export const toCashCountLines = (
  quantities: CashCountQuantities,
): CashCountLine[] =>
  CASH_DENOMINATIONS.map((value) => ({
    value,
    quantity: toQuantity(quantities[value]),
  })).filter((line) => line.quantity > 0);

export const fromCashCountLines = (
  lines: CashCountLine[] | null | undefined,
): CashCountQuantities =>
  Object.fromEntries(
    (lines ?? []).map((line) => [line.value, String(line.quantity)]),
  );
