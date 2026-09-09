import { restaurantApi } from "@/core/api/restaurantApi";
import { RegisterPushTokenDto } from "@/core/push-notifications/dto/register-push-token.dto";

export class PushNotificationsService {
  static async registerToken(data: RegisterPushTokenDto) {
    const resp = await restaurantApi.post<void>(
      "/push-notifications/register",
      data,
    );
    return resp.data;
  }

  static async unregisterToken(data: RegisterPushTokenDto) {
    const resp = await restaurantApi.post<void>(
      "/push-notifications/logout",
      data,
    );
    return resp.data;
  }
}
