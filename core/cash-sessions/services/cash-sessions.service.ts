import { restaurantApi } from "@/core/api/restaurantApi";
import { Transaction } from "@/core/transactions/models/transaction.model";
import {
  CashCountLine,
  CashRegister,
  CashSession,
  CashSessionDetail,
  CashSessionSummary,
} from "../models/cash-session.model";

export interface CashSessionsFilter {
  startDate?: string;
  endDate?: string;
  accountId?: number;
  limit?: number;
  offset?: number;
}

export class CashSessionsService {
  static async getRegisters(): Promise<CashRegister[]> {
    const resp = await restaurantApi.get<CashRegister[]>(
      "/cash-sessions/registers",
    );
    return resp.data;
  }

  static async getSessions(
    filter: CashSessionsFilter,
  ): Promise<{ sessions: CashSession[]; count: number }> {
    const resp = await restaurantApi.get<{
      sessions: CashSession[];
      count: number;
    }>("/cash-sessions", { params: filter });
    return resp.data;
  }

  static async getSession(id: number): Promise<CashSessionDetail> {
    const resp = await restaurantApi.get<CashSessionDetail>(
      `/cash-sessions/${id}`,
    );
    return resp.data;
  }

  static async open(data: {
    accountId: number;
    openingAmount: number;
    openingBreakdown?: CashCountLine[];
  }): Promise<CashSession> {
    const resp = await restaurantApi.post<CashSession>("/cash-sessions", data);
    return resp.data;
  }

  /** Leave `countedAmount` out to close without counting (owner/admin). */
  static async close(
    id: number,
    data: {
      countedAmount?: number;
      countedBreakdown?: CashCountLine[];
      note?: string;
    },
  ): Promise<CashSession & { summary: CashSessionSummary }> {
    const resp = await restaurantApi.post<
      CashSession & { summary: CashSessionSummary }
    >(`/cash-sessions/${id}/close`, data);
    return resp.data;
  }

  static async withdraw(data: {
    accountId: number;
    amount: number;
    reason: string;
  }): Promise<Transaction> {
    const resp = await restaurantApi.post<Transaction>(
      "/transactions/withdrawals",
      data,
    );
    return resp.data;
  }
}
