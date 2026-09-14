import { restaurantApi } from "@/core/api/restaurantApi";
import { Table } from "../models/table.model";
import type { CreateTableDto } from "@/presentation/tables/interfaces/dto/create-table.dto";
import type { UpdateTableDto } from "@/presentation/tables/interfaces/dto/update-table.dto";

export class TablesService {
  static async getTables(): Promise<Table[]> {
    const resp = await restaurantApi.get<Table[]>("/tables");
    return resp.data;
  }

  static async createTable(data: CreateTableDto): Promise<Table> {
    const resp = await restaurantApi.post<Table>("/tables", data);
    return resp.data;
  }

  static async updateTable(data: UpdateTableDto): Promise<Table> {
    const { id, ...updateData } = data;
    const resp = await restaurantApi.patch<Table>(`/tables/${id}`, updateData);
    return resp.data;
  }

  static async deleteTable(id: string): Promise<void> {
    await restaurantApi.delete(`/tables/${id}`);
  }
}
