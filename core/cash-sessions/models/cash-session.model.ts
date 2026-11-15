import { User } from "@/core/auth/models/user.model";
import { Account } from "@/core/restaurant/models/account.model";
import { Transaction } from "@/core/transactions/models/transaction.model";

export enum CashSessionStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
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
  openingAmount: number;
  /** Counted at the previous close of this register, if any. */
  lastCountedAmount: number | null;
  closedBy: User | null;
  closedAt: string | null;
  /** Null when an owner/admin closed it without counting. */
  countedAmount: number | null;
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
  cashOut: number;
  outCount: number;
  /** Withdrawals waiting for an owner/admin; already out of the drawer. */
  pendingOut: number;
  pendingCount: number;
  /** Null for a cashier while the register is open (blind count). */
  expectedAmount: number | null;
}

export interface CashSessionDetail extends CashSession {
  summary: CashSessionSummary;
  transactions: Transaction[];
}

export interface CashRegister {
  account: Pick<Account, "id" | "name">;
  /** Cash payment methods that drop money into this register. */
  paymentMethodIds: number[];
  /** Counted at the last close, to prefill the next opening. */
  lastCountedAmount: number | null;
  session: CashSession | null;
}
