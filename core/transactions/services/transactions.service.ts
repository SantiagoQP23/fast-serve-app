import { restaurantApi } from "@/core/api/restaurantApi";
import { FilterTransactionsDto } from "../dto/filter-transactions.dto";
import { TransactionListResponseDto } from "../dto/transaction-list-response.dto";
import { PaymentMethodReportResponse } from "../dto/payment-method-report-response.dto";
import { Transaction } from "../models/transaction.model";

export class TransactionsService {
  static async getTransactions(
    filters?: FilterTransactionsDto,
  ): Promise<TransactionListResponseDto> {
    const resp = await restaurantApi.get<TransactionListResponseDto>(
      "/transactions",
      { params: filters },
    );
    return resp.data;
  }

  static async getTransactionById(id: number): Promise<Transaction> {
    const resp = await restaurantApi.get<Transaction>(`/transactions/${id}`);
    return resp.data;
  }

  static async updateTransaction(
    id: number,
    data: { accountId?: number },
  ): Promise<Transaction> {
    const resp = await restaurantApi.patch<Transaction>(
      `/transactions/${id}`,
      data,
    );
    return resp.data;
  }

  static async approveTransaction(id: number): Promise<Transaction> {
    const resp = await restaurantApi.post<Transaction>(
      `/transactions/${id}/approve`,
    );
    return resp.data;
  }

  static async rejectTransaction(
    id: number,
    reason: string,
  ): Promise<Transaction> {
    const resp = await restaurantApi.post<Transaction>(
      `/transactions/${id}/reject`,
      { reason },
    );
    return resp.data;
  }

  static async getPaymentMethodReport(
    filters?: FilterTransactionsDto,
  ): Promise<PaymentMethodReportResponse> {
    const resp = await restaurantApi.get<PaymentMethodReportResponse>(
      "/transactions/reports/by-payment-method",
      { params: filters },
    );
    return resp.data;
  }
}
