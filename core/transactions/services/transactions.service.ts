import { restaurantApi } from "@/core/api/restaurantApi";
import { FilterTransactionsDto } from "../dto/filter-transactions.dto";
import { TransactionListResponseDto } from "../dto/transaction-list-response.dto";
import { PaymentMethodReportResponse } from "../dto/payment-method-report-response.dto";

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
