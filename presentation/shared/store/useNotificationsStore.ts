import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useSyncExternalStore } from "react";

export type NotificationPermission = "undetermined" | "granted" | "denied";

interface NotificationsState {
  /**
   * Whether this device should receive push notifications. Saved per device,
   * like the theme. The OS permission is separate: it can only be changed
   * from the system settings once the user has answered the prompt.
   */
  enabled: boolean;
  /** null until the OS has been asked. Not saved: the OS owns this value. */
  permission: NotificationPermission | null;
  /** false once the OS will no longer show the permission prompt. */
  canAskAgain: boolean;

  setEnabled: (enabled: boolean) => void;
  refreshPermission: () => Promise<NotificationPermission>;
  requestPermission: () => Promise<NotificationPermission>;
}

const toPermission = (
  result: Notifications.NotificationPermissionsStatus,
): NotificationPermission => {
  if (result.granted) return "granted";
  return result.status === Notifications.PermissionStatus.UNDETERMINED
    ? "undetermined"
    : "denied";
};

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      enabled: true,
      permission: null,
      canAskAgain: true,

      setEnabled: (enabled) => set({ enabled }),

      refreshPermission: async () => {
        const result = await Notifications.getPermissionsAsync();
        const permission = toPermission(result);
        set({ permission, canAskAgain: result.canAskAgain });
        return permission;
      },

      requestPermission: async () => {
        const result = await Notifications.requestPermissionsAsync();
        const permission = toPermission(result);
        set({ permission, canAskAgain: result.canAskAgain });
        return permission;
      },
    }),
    {
      name: "notifications-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ enabled: state.enabled }),
    },
  ),
);

/** True once the saved preference has been read from storage. */
export const useNotificationsHydrated = () =>
  useSyncExternalStore(
    useNotificationsStore.persist.onFinishHydration,
    useNotificationsStore.persist.hasHydrated,
    () => true,
  );
