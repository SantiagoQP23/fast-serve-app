import { User } from "@/core/auth/models/user.model";
import { Account } from "@/core/restaurant/models/account.model";
import { Transaction } from "@/core/transactions/models/transaction.model";

export enum CashSessionStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
}

/** How many of one bill or coin were counted. */
export interface CashCountLine {
  value: number;
  quantity: number;
}

/**
 * One opening and closing of a register. A register is a CASH account linked
 * to a cash payment method (plans/apertura-cierre-caja.md).
 */
export interface CashSession {
  id: number;
  account: Account;
  status: CashSessionStatus;
  openedBy: User | null;
  openedAt: string;
  /**
   * Who runs the register now (plans/reasignar-caja.md). Starts as the
   * opener; changes on a reassign. Null when that person was removed.
   */
  responsible?: User | null;
  /** Since when `responsible` holds it. */
  responsibleSince?: string | null;
  /** Number of handovers (history list only). */
  assignmentCount?: number;
  openingAmount: number;
  /** Bills and coins counted at opening; null when only the total was typed. */
  openingBreakdown: CashCountLine[] | null;
  /** Counted at the previous close of this register, if any. */
  lastCountedAmount: number | null;
  closedBy: User | null;
  closedAt: string | null;
  /** Null when an owner/admin closed it without counting. */
  countedAmount: number | null;
  /** Bills and coins counted at closing; null when only the total was typed. */
  countedBreakdown: CashCountLine[] | null;
  expectedAmount: number | null;
  /** counted − expected: positive is over, negative is short. */
  difference: number | null;
  note: string | null;
  adjustedAfterClose: boolean;
}

export interface CashSessionSummary {
  openingAmount: number;
  cashIncome: number;
  incomeCount: number;
  /** Cash added to the drawer (plans/ingreso-efectivo-caja.md). */
  cashIn: number;
  inCount: number;
  cashOut: number;
  outCount: number;
  /** Withdrawals waiting for an owner/admin; already out of the drawer. */
  pendingOut: number;
  pendingCount: number;
  /** Null for a cashier while the register is open (blind count). */
  expectedAmount: number | null;
}

/** One handover of an open register (plans/reasignar-caja.md). */
export interface CashSessionAssignment {
  id: number;
  fromUser: User | null;
  toUser: User | null;
  assignedBy: User | null;
  assignedAt: string;
  /** Null when handed over without counting. */
  countedAmount: number | null;
  countedBreakdown: CashCountLine[] | null;
  expectedAmount: number | null;
  difference: number | null;
  note: string | null;
}

/** Someone who can take an open register over. */
export interface AssignableUser {
  id: string;
  username: string;
  person: { firstName: string; lastName: string } | null;
  role: string;
}

export interface CashSessionDetail extends CashSession {
  summary: CashSessionSummary;
  transactions: Transaction[];
  assignments?: CashSessionAssignment[];
}

/**
 * Whether `userId` runs the register now. Mirrors the server: sessions from
 * before reassigning existed have no `responsible`, so their opener runs them.
 */
export const isRegisterHolder = (
  session: Pick<CashSession, "responsible" | "responsibleSince" | "openedBy">,
  userId: string | undefined,
) => {
  if (!userId) return false;
  if (session.responsible) return session.responsible.id === userId;
  return !session.responsibleSince && session.openedBy?.id === userId;
};

/** Who runs the register now, for display. */
export const registerHolder = (
  session: Pick<CashSession, "responsible" | "responsibleSince" | "openedBy">,
) =>
  session.responsible ?? (session.responsibleSince ? null : session.openedBy);

export interface CashRegister {
  account: Pick<Account, "id" | "name">;
  /** Cash payment methods that drop money into this register. */
  paymentMethodIds: number[];
  /** Counted at the last close, to prefill the next opening. */
  lastCountedAmount: number | null;
  /** Bills and coins of that count, when they were counted one by one. */
  lastCountedBreakdown: CashCountLine[] | null;
  session: CashSession | null;
}
