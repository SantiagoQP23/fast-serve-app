import { restaurantApi } from "@/core/api/restaurantApi";
import { Bill } from "../models/bill.model";
import { PaymentMethodReportResponseDto } from "../dto/payment-method-report-response.dto";
import { FilterPaymentMethodReportDto } from "../dto/payment-method-report-filters.dto";
import { BillListResponseDto } from "../dto/bill-list-response.dto";
import { BillListFiltersDto } from "../dto/bill-list-filters.dto";

export class BillsService {
  static async getBillByOrders(orderId: string): Promise<Bill[]> {
    const resp = await restaurantApi.get<any>(`/bills/order/${orderId}`);
    return resp.data;
  }

  static async getPaymentMethodReport(
    filters?: FilterPaymentMethodReportDto,
  ): Promise<PaymentMethodReportResponseDto> {
    const resp = await restaurantApi.get<PaymentMethodReportResponseDto>(
      "/bills/reports/income-by-payment-method",
      {
        params: filters,
      },
    );
    return resp.data;
  }

  static async getBillList(
    filters?: BillListFiltersDto,
  ): Promise<BillListResponseDto> {
    const resp = await restaurantApi.get<BillListResponseDto>("/bills/list", {
      params: filters,
    });
    return resp.data;
  }
}
