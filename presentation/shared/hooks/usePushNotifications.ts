import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router, useRootNavigationState } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { PushNotificationsService } from "@/core/push-notifications/services/push-notifications.service";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

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

function handleRegistrationError(errorMessage: string) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      //! Aviso al usuario que va a recibir el prompt
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      handleRegistrationError(
        "Permission not granted to get push token for push notification!",
      );
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError("Project ID not found");
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log({ [Platform.OS]: pushTokenString });
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    handleRegistrationError("Must use physical device for push notifications");
  }
}

export const usePushNotifications = () => {
  const [pendingChatId, setPendingChatId] = useState<string | null>("");
  const rootNavigationState = useRootNavigationState();

  const authStatus = useAuthStore((state) => state.status);
  const authToken = useAuthStore((state) => state.token);
  const lastRegisteredRef = useRef<string | null>(null);

  const [expoPushToken, setExpoPushToken] = useState("");
  const [notifications, setNotifications] = useState<
    Notifications.Notification[]
  >([]);

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then(async (token) => {
        setExpoPushToken(token ?? "");
        if (token) {
          await SecureStorageAdapter.setItem("expoPushToken", token);
        }
      })
      .catch((error: any) => setExpoPushToken(`${error}`));
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated" || !authToken) return;
    if (!expoPushToken || expoPushToken.startsWith("Error")) return;

    const registrationKey = `${authToken}:${expoPushToken}`;
    if (lastRegisteredRef.current === registrationKey) return;

    PushNotificationsService.registerToken({ token: expoPushToken })
      .then(() => {
        lastRegisteredRef.current = registrationKey;
      })
      .catch((error: any) => {
        console.log("Failed to register push token", error);
      });
  }, [expoPushToken, authStatus, authToken]);

  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotifications((prevNotifications) => [
          notification,
          ...prevNotifications,
        ]);
      },
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("addNotificationResponseReceivedListener:");
        console.log(response.notification.request.content.data);
        const chatId = response.notification.request.content.data?.chatId;
        if (typeof chatId === "string" && chatId.length > 0) {
          setPendingChatId(chatId);
        }
      });

    const handleInitialNotificationResponse = () => {
      const response = Notifications.getLastNotificationResponse();

      const chatId = response?.notification?.request?.content?.data?.chatId;
      if (typeof chatId === "string" && chatId.length > 0) {
        setPendingChatId(chatId);
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

  return {
    // Props
    expoPushToken,
    notifications,

    // Methods
    sendPushNotification,
  };
};
