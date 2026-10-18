import { restaurantApi } from "@/core/api/restaurantApi";
import { RegisterPushTokenDto } from "@/core/push-notifications/dto/register-push-token.dto";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";

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

  /**
   * Stops this device from receiving pushes for the signed-in user. The saved
   * token is only forgotten once the server confirms, so a failure (e.g. no
   * connection) is retried the next time this runs.
   */
  static async unregisterStoredToken() {
    const token = await SecureStorageAdapter.getItem("expoPushToken");
    if (!token) return;

    await PushNotificationsService.unregisterToken({ token });
    await SecureStorageAdapter.removeItem("expoPushToken");
  }
}
