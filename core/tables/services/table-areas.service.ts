import { restaurantApi } from "@/core/api/restaurantApi";
import type { TableArea } from "../models/table-area.model";

export class TableAreasService {
  static async getAll(): Promise<TableArea[]> {
    const resp = await restaurantApi.get<TableArea[]>("/table-areas");
    return resp.data;
  }

  static async create(name: string): Promise<TableArea> {
    const resp = await restaurantApi.post<TableArea>("/table-areas", { name });
    return resp.data;
  }

  static async update(
    id: string,
    data: { name?: string; isActive?: boolean },
  ): Promise<TableArea> {
    const resp = await restaurantApi.patch<TableArea>(
      `/table-areas/${id}`,
      data,
    );
    return resp.data;
  }

  static async remove(id: string): Promise<void> {
    await restaurantApi.delete(`/table-areas/${id}`);
  }

  /** `areaIds`: todas las zonas del restaurante en el nuevo orden. */
  static async reorder(areaIds: string[]): Promise<TableArea[]> {
    const resp = await restaurantApi.patch<TableArea[]>(
      "/table-areas/reorder",
      { areaIds },
    );
    return resp.data;
  }
}
