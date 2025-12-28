import { restaurantApi } from "@/core/api/restaurantApi";
import { Order } from "../models/order.model";
import { DashboardStatsDto } from "../dto/dashboard-stats.dto";

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
}
