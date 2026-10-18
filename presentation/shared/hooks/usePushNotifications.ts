import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router, useRootNavigationState } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { PushNotificationsService } from "@/core/push-notifications/services/push-notifications.service";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { PushNotificationType } from "@/core/push-notifications/enums/push-notification-type.enum";
import { PushNotification } from "@/core/push-notifications/model/push-notification.model";
import {
  useNotificationsHydrated,
  useNotificationsStore,
} from "@/presentation/shared/store/useNotificationsStore";
import { useAppForeground } from "@/presentation/shared/hooks/useAppForeground";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface SendPushOptions {
  to: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
}

async function sendPushNotification(options: SendPushOptions) {
  const { to, title, body, data } = options;

  const message = {
    to: to,
    sound: "default",
    title: title,
    body: body,
    data: data,
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}

async function setupAndroidChannel() {
  if (Platform.OS !== "android") return;

  // Android 13+ only shows the permission prompt once a channel exists.
  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF231F7C",
  });
}

/** Asks the OS for permission, but only if the user hasn't answered yet. */
async function askForPermissionOnce() {
  await setupAndroidChannel();

  const { refreshPermission, requestPermission } =
    useNotificationsStore.getState();
  const permission = await refreshPermission();
  if (permission === "undetermined") await requestPermission();
}

async function getPushTokenAsync() {
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;
  if (!projectId) {
    console.log("Push notifications: project ID not found");
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log({ [Platform.OS]: data });
    return data;
  } catch (e: unknown) {
    console.log("Push notifications: couldn't get the push token", e);
    return null;
  }
}

export const usePushNotifications = () => {
  const [pendingChatId, setPendingChatId] = useState<string | null>("");
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>("");
  const [pendingInventoryItemId, setPendingInventoryItemId] = useState<
    string | null
  >("");
  const [pendingRestaurantsOpen, setPendingRestaurantsOpen] = useState(false);
  const rootNavigationState = useRootNavigationState();

  const authStatus = useAuthStore((state) => state.status);
  const authToken = useAuthStore((state) => state.token);
  const lastRegisteredRef = useRef<string | null>(null);

  const [expoPushToken, setExpoPushToken] = useState("");
  const [notifications, setNotifications] = useState<
    Notifications.Notification[]
  >([]);

  const notificationsEnabled = useNotificationsStore((state) => state.enabled);
  const notificationPermission = useNotificationsStore(
    (state) => state.permission,
  );
  const refreshPermission = useNotificationsStore(
    (state) => state.refreshPermission,
  );
  const notificationsHydrated = useNotificationsHydrated();

  // The user may allow notifications from the system settings.
  useEffect(() => {
    refreshPermission().catch(() => {});
  }, [refreshPermission]);
  useAppForeground(() => {
    refreshPermission().catch(() => {});
  });

  // Ask for permission once the user is signed in, not on the login screen.
  useEffect(() => {
    if (authStatus !== "authenticated" || !notificationsHydrated) return;
    if (!notificationsEnabled || !Device.isDevice) return;

    askForPermissionOnce().catch((error) =>
      console.log("Push notifications: permission request failed", error),
    );
  }, [authStatus, notificationsHydrated, notificationsEnabled]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !notificationsHydrated) return;
    if (!notificationsEnabled || notificationPermission !== "granted") return;
    if (!Device.isDevice) return;

    let cancelled = false;
    getPushTokenAsync().then(async (token) => {
      if (cancelled || !token) return;
      setExpoPushToken(token);
      await SecureStorageAdapter.setItem("expoPushToken", token);
    });

    return () => {
      cancelled = true;
    };
  }, [
    authStatus,
    notificationsHydrated,
    notificationsEnabled,
    notificationPermission,
  ]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !authToken) return;
    if (!notificationsEnabled || !expoPushToken) return;

    const registrationKey = `${authToken}:${expoPushToken}`;
    if (lastRegisteredRef.current === registrationKey) return;

    PushNotificationsService.registerToken({ token: expoPushToken })
      .then(() => {
        lastRegisteredRef.current = registrationKey;
      })
      .catch((error: any) => {
        console.log("Failed to register push token", error);
      });
  }, [expoPushToken, authStatus, authToken, notificationsEnabled]);

  // Turned off in settings: this device stops receiving pushes.
  useEffect(() => {
    if (authStatus !== "authenticated" || !notificationsHydrated) return;
    if (notificationsEnabled) return;

    lastRegisteredRef.current = null;
    PushNotificationsService.unregisterStoredToken().catch((error: any) => {
      console.log("Failed to unregister push token", error);
    });
  }, [authStatus, notificationsHydrated, notificationsEnabled]);

  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotifications((prevNotifications) => [
          notification,
          ...prevNotifications,
        ]);

        // Acceso a una sucursal nueva: refresca los restaurantes del usuario.
        const data = notification.request.content
          .data as any as PushNotification;
        if (data?.type === PushNotificationType.RESTAURANT_ACCESS_GRANTED) {
          useAuthStore.getState().revalidateSession();
        }
      },
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // const chatId = response.notification.request.content.data?.chatId;
        // if (typeof chatId === "string" && chatId.length > 0) {
        //   setPendingChatId(chatId);
        // }

        const notification = response?.notification?.request?.content
          ?.data as any as PushNotification;

        if (notification) {
          switch (notification.type) {
            case PushNotificationType.NEW_PAYMENT:
              // router.push(`/payments/${notification.payload.paymentId}`);
              setPendingPaymentId(notification.payload.paymentId as string);
              break;
            case PushNotificationType.LOW_STOCK:
              setPendingInventoryItemId(
                notification.payload.inventoryItemId as string,
              );
              break;
            case PushNotificationType.RESTAURANT_ACCESS_GRANTED:
              setPendingRestaurantsOpen(true);
              break;
          }
        }
      });

    const handleInitialNotificationResponse = () => {
      const response = Notifications.getLastNotificationResponse();

      const notification = response?.notification?.request?.content
        ?.data as any as PushNotification;
      // if (typeof chatId === "string" && chatId.length > 0) {
      //   setPendingChatId(chatId);
      //
      // }
      //
      if (notification) {
        switch (notification.type) {
          case PushNotificationType.NEW_PAYMENT:
            // router.push(`/payments/${notification.payload.paymentId}`);
            setPendingPaymentId(notification.payload.paymentId as string);
            break;
          case PushNotificationType.LOW_STOCK:
            setPendingInventoryItemId(
              notification.payload.inventoryItemId as string,
            );
            break;
          case PushNotificationType.RESTAURANT_ACCESS_GRANTED:
            setPendingRestaurantsOpen(true);
            break;

          // case PushNotificationType.NEW_ORDER:
          //   router.push(`/orders/${notification.payload.orderId}`);
          //   break;
        }
      }
    };

    handleInitialNotificationResponse();

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  useEffect(() => {
    if (!rootNavigationState.key) return;
    if (!pendingChatId) return;

    router.push(`/transaction/${pendingChatId}`);
    setPendingChatId(null);
  }, [pendingChatId, rootNavigationState?.key]);

  useEffect(() => {
    if (!rootNavigationState.key) return;
    if (!pendingPaymentId) return;

    router.push(`/transaction/${pendingPaymentId}`);
    setPendingPaymentId(null);
  }, [pendingPaymentId, rootNavigationState?.key]);

  useEffect(() => {
    if (!rootNavigationState.key) return;
    if (!pendingInventoryItemId) return;

    router.push({
      pathname: "/(profile)/inventory/items/detail",
      params: { itemId: pendingInventoryItemId },
    });
    setPendingInventoryItemId(null);
  }, [pendingInventoryItemId, rootNavigationState?.key]);

  useEffect(() => {
    if (!rootNavigationState.key) return;
    if (!pendingRestaurantsOpen) return;

    // La lista muestra la sucursal nueva después de refrescar la sesión.
    useAuthStore
      .getState()
      .revalidateSession()
      .finally(() => {
        setPendingRestaurantsOpen(false);
        router.push("/(profile)/restaurant/list");
      });
  }, [pendingRestaurantsOpen, rootNavigationState?.key]);

  return {
    // Props
    expoPushToken,
    notifications,

    // Methods
    sendPushNotification,
  };
};
