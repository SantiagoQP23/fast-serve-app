import { PushNotificationType } from "../enums/push-notification-type.enum";

export interface PushNotification {
  type: PushNotificationType;
  payload: Record<string, unknown>;
}
