import { restaurantApi } from "@/core/api/restaurantApi";
import { Order } from "../models/order.model";
import { DashboardStatsDto } from "../dto/dashboard-stats.dto";
import { DailyReportResponseDto } from "../dto/daily-report-response.dto";
import { FilterDailyReportDto } from "../dto/daily-report-filters.dto";

export class OrdersService {
  static async getActiveOrders(): Promise<Order[]> {
    const resp = await restaurantApi.get<Order[]>("/orders/actives", {
      params: {
        limit: 50,
        offset: 0,
        startDate: new Date("01-01-2025"),
        period: "yearly",
      },
    });
    return resp.data;
  }

  static async getDashboardStats(): Promise<DashboardStatsDto> {
    const resp = await restaurantApi.get<DashboardStatsDto>(
      "/orders/daily-summary",
    );
    return resp.data;
  }

  static async getDailyReport(
    filters?: FilterDailyReportDto,
  ): Promise<DailyReportResponseDto> {
    const resp = await restaurantApi.get<DailyReportResponseDto>(
      "/orders/daily-report",
      {
        params: filters,
      },
    );
    return resp.data;
  }
}
