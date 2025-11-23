import { restaurantApi } from "@/core/api/restaurantApi";
import { Bill } from "../models/bill.model";
export class BillsService {
  static async getBillByOrders(orderId: string): Promise<Bill[]> {
    const resp = await restaurantApi.get<any>(`/bills/order/${orderId}`);
    return resp.data;
  }
}
