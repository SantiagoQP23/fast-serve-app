import { PaymentMethod } from "../enums/payment-method";

export interface PaymentMethodReportSummaryDto {
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalBills: number;
}

export interface PaymentMethodStatsDto {
  paymentMethod: PaymentMethod;
  totalIncome: number;
  billCount: number;
  percentage: number;
  avgBillAmount: number;
}

export interface PaymentMethodReportResponseDto {
  summary: PaymentMethodReportSummaryDto;
  paymentMethods: PaymentMethodStatsDto[];
}
