/**
 * Helpers for splitting an order into several bills. Quantities on bills
 * carry up to three decimals so one item can be shared: a pizza for three is
 * 0.333 + 0.333 + 0.334.
 */

const SCALE = 1000;

export const roundQty = (value: number) => Math.round(value * SCALE) / SCALE;

/** Units of an order line not on any bill yet. */
export const getUnbilledQty = (detail: { quantity: number; qtyPaid: number }) =>
  Math.max(roundQty(detail.quantity - detail.qtyPaid), 0);

/**
 * Splits `qty` units into `parts` shares that add up exactly; the last share
 * takes what's left (1 / 3 = 0.333, 0.333, 0.334).
 */
export const shareQuantity = (qty: number, parts: number): number[] => {
  if (parts <= 0) return [];
  const total = Math.round(qty * SCALE);
  const base = Math.floor(total / parts);
  return Array.from({ length: parts }, (_, i) =>
    i === parts - 1 ? (total - base * (parts - 1)) / SCALE : base / SCALE,
  );
};

/**
 * "2", "1/3", "1 1/2", or "0.25" for quantities that aren't a simple
 * fraction. Shares like 0.333 or 0.334 read as "1/3".
 */
export const formatQuantity = (qty: number): string => {
  const value = roundQty(qty);
  const whole = Math.floor(value + 0.0005);
  const rest = value - whole;
  if (Math.abs(rest) < 0.0015) return String(whole);
  for (let denominator = 2; denominator <= 12; denominator++) {
    const numerator = Math.round(rest * denominator);
    if (numerator === 0 || numerator === denominator) continue;
    if (Math.abs(rest - numerator / denominator) < 0.0015) {
      const fraction = `${numerator}/${denominator}`;
      return whole > 0 ? `${whole} ${fraction}` : fraction;
    }
  }
  return String(value);
};

/** The bill's name when it has one, otherwise its number. */
export const getBillTitle = (
  bill: { label?: string | null; num: number; source?: string },
  t: (key: string, options?: Record<string, unknown>) => string,
) =>
  bill.label?.trim() ||
  t(`bills:list.${bill.source ?? "order"}`, { number: bill.num });
