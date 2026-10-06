import { restaurantApi } from "@/core/api/restaurantApi";
import type {
  RestaurantSettings,
  RestaurantSettingValue,
} from "../models/restaurant-settings.model";

export class RestaurantSettingsService {
  static async getAll() {
    const resp = await restaurantApi.get<RestaurantSettings>(`settings`);

    return resp.data;
  }

  static async update(settings: Record<string, RestaurantSettingValue>) {
    const resp = await restaurantApi.patch<RestaurantSettings>(`settings`, {
      settings,
    });

    return resp.data;
  }
}
