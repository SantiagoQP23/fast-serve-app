import { restaurantApi } from "@/core/api/restaurantApi";
import { Order } from "../models/order.model";
import { DashboardStatsDto } from "../dto/dashboard-stats.dto";
import { DailyReportResponseDto } from "../dto/daily-report-response.dto";
import { FilterDailyReportDto } from "../dto/daily-report-filters.dto";
import { OrderHistoryFiltersDto } from "../dto/order-history-filters.dto";
import { OrderHistoryRespDto } from "../dto/order-history-resp.dto";
import {
  BestSellingProductsFiltersDto,
  BestSellingProductsResponseDto,
} from "../dto/best-selling-products.dto";
import {
  BestSellingCategoriesFiltersDto,
  BestSellingCategoriesResponseDto,
} from "../dto/best-selling-categories.dto";

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

  static async getOrderById(orderId: string): Promise<Order> {
    const resp = await restaurantApi.get<Order>(`/orders/${orderId}`);
    return resp.data;
  }

  static async getDashboardStats(
    filters?: { startDate?: string; endDate?: string; userId?: string },
  ): Promise<DashboardStatsDto> {
    const resp = await restaurantApi.get<DashboardStatsDto>(
      "/dashboard/daily-summary",
      {
        params: filters,
      },
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

  static async getUserClosedOrders(
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ orders: Order[]; count?: number }> {
    const resp = await restaurantApi.get<{ orders: Order[]; count?: number }>(
      "/orders/user-closed-orders",
      {
        params: {
          limit,
          offset,
        },
      },
    );
    return resp.data;
  }

  static async getOrderHistory(
    filters?: OrderHistoryFiltersDto,
  ): Promise<OrderHistoryRespDto> {
    const resp = await restaurantApi.get<OrderHistoryRespDto>("/orders", {
      params: { ...filters, period: "custom" },
    });
    return resp.data;
  }

  static async getBestSellingProducts(
    filters?: BestSellingProductsFiltersDto,
  ): Promise<BestSellingProductsResponseDto> {
    const resp = await restaurantApi.get<BestSellingProductsResponseDto>(
      "/orders/best-selling-products",
      {
        params: { ...filters, period: "custom" },
      },
    );
    return resp.data;
  }

  static async getBestSellingCategories(
    filters?: BestSellingCategoriesFiltersDto,
  ): Promise<BestSellingCategoriesResponseDto> {
    const resp = await restaurantApi.get<BestSellingCategoriesResponseDto>(
      "/orders/best-selling-categories",
      {
        params: { ...filters, period: "custom" },
      },
    );
    return resp.data;
  }
}
