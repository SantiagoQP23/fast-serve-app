export interface WaiterOrderDetailDto {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  amount: number;
}

export interface WaiterBillDetailDto {
  quantity: number;
  price: number;
  total: number;
}

export interface WaiterBillDto {
  id: number;
  num: number;
  total: number;
  subtotal: number;
  discount: number;
  paymentMethod: string;
  isPaid: boolean;
  createdAt: Date;
  details: WaiterBillDetailDto[];
}

export interface WaiterOrderDto {
  id: string;
  num: number;
  total: number;
  isPaid: boolean;
  status: string;
  type: string;
  people: number;
  notes: string;
  createdAt: Date;
  tableName: string;
  billsCount: number;
  details: WaiterOrderDetailDto[];
  bills: WaiterBillDto[];
}

export interface WaiterStatsDto {
  userId: string;
  username: string;
  fullName: string;
  roleName: string;
  totalOrders: number;
  totalAmount: number;
  totalIncome: number;
  totalBills: number;
  orders: WaiterOrderDto[];
}

export interface DailySummaryDto {
  date: string;
  totalIncome: number;
  totalOrders: number;
  totalBills: number;
  totalWaiters: number;
  totalAmount: number;
}

export interface DailyReportResponseDto {
  summary: DailySummaryDto;
  waiterStats: WaiterStatsDto[];
  allOrders?: WaiterOrderDto[];
}
