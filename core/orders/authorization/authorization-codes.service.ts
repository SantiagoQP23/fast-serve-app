import { restaurantApi } from "@/core/api/restaurantApi";
import type { AuthorizationCode } from "./authorization-code.model";

export class AuthorizationCodesService {
  static async generate() {
    const resp = await restaurantApi.post<AuthorizationCode>(
      "authorization-codes",
    );
    return resp.data;
  }

  /** Codes created between `from` and `to` (ISO), newest first. */
  static async findAll(from: string, to: string) {
    const resp = await restaurantApi.get<AuthorizationCode[]>(
      "authorization-codes",
      { params: { from, to } },
    );
    return resp.data;
  }

  static async void(id: string) {
    const resp = await restaurantApi.patch<AuthorizationCode>(
      `authorization-codes/${id}/void`,
    );
    return resp.data;
  }
}
