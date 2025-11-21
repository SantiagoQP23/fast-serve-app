import { restaurantApi } from "@/core/api/restaurantApi";
import { Menu } from "../models/menu.model";

export class RestaurantMenuService {
  static async getAllMenu(restaurantId: string): Promise<Menu> {
    const resp = await restaurantApi.get<Menu>(`/menu/${restaurantId}`);
    return resp.data;
  }
}
