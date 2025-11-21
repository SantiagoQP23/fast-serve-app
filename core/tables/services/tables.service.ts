import { restaurantApi } from "@/core/api/restaurantApi";
import { Table } from "../models/table.model";

export class TablesService {
  static async getTables(): Promise<Table[]> {
    const resp = await restaurantApi.get<Table[]>("/tables");
    return resp.data;
  }
}
