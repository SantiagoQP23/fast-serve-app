import { restaurantApi } from "@/core/api/restaurantApi";
import { SyncResponseDto } from "../dto/sync-response.dto";

export class SyncService {
  static async sync(
    restaurantId: string,
    since?: number,
  ): Promise<SyncResponseDto> {
    const resp = await restaurantApi.get<SyncResponseDto>(
      `/restaurants/${restaurantId}/sync`,
      {
        params: since !== undefined ? { since } : undefined,
      },
    );
    return resp.data;
  }
}
