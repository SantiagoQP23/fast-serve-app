export interface DashboardStatsDto {
  startDate: string;
  endDate: string;
  ordersQuantity: number;
  salesQuantity: number;
  totalSales: number;
  totalAmount: number;
  totalIncome: number;
  // Orders only (no direct sales). Optional until the backend ships it.
  ordersAmount?: number;
  averageOrderAmount?: number;
}
