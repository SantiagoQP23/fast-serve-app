import { Alert } from "react-native";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { useRestaurantSettings } from "@/presentation/restaurant/hooks/useRestaurantSettings";
import { DEFAULT_REQUIRE_CODE_TO_REMOVE_ITEMS } from "@/core/restaurant/models/restaurant-settings.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { hasPendingOperations } from "@/presentation/offline/store/useOutboxStore";
import { useContext } from "react";
import { SocketContext } from "@/presentation/shared/context/SocketContext";
import {
  AuthorizationResult,
  useAuthorizationCodeStore,
} from "./useAuthorizationCodeStore";

export type { AuthorizationResult };

/** Sends the action; `code` is undefined when no code is needed. */
export type AuthorizedAction = (code?: string) => Promise<AuthorizationResult>;

/**
 * "Pedir código para quitar productos": who isn't owner/admin needs an
 * owner/admin code to delete items, lower quantities, replace items or
 * cancel the order, and can't change prices.
 */
export const useRemovalAuthorization = () => {
  const { t } = useTranslation(["orders", "errors"]);
  const user = useAuthStore((state) => state.user);
  const restaurantId = useAuthStore((state) => state.currentRestaurant?.id);
  const { settings } = useRestaurantSettings();
  const { socket } = useContext(SocketContext);
  const openSheet = useAuthorizationCodeStore((state) => state.open);

  const protectionOn =
    (settings?.REQUIRE_CODE_TO_REMOVE_ITEMS ??
      DEFAULT_REQUIRE_CODE_TO_REMOVE_ITEMS) === true;
  const isAdmin = isAdminLevelRole(user?.role?.name);
  const needsCode = protectionOn && !isAdmin;

  /**
   * Runs `run` right away when no code is needed. Otherwise asks for the
   * code first (online only: the server checks it). If the server asks for
   * a code the phone didn't know about (settings not loaded yet), the sheet
   * opens then.
   */
  const authorize = async (summary: string, run: AuthorizedAction) => {
    if (needsCode) {
      if (!socket?.connected || hasPendingOperations(restaurantId)) {
        Alert.alert(
          t("orders:authorization.needsConnectionTitle"),
          t("orders:authorization.needsConnection"),
        );
        return;
      }
      openSheet({ summary, submit: (code) => run(code) });
      return;
    }

    const result = await run(undefined);
    if (!result.ok && result.code === "ORDER_AUTH_CODE_REQUIRED") {
      openSheet({ summary, submit: (code) => run(code) });
    }
  };

  return {
    /** The setting is on and this user isn't owner/admin. */
    needsCode,
    /** Restricted users can't change an item's price. */
    canChangePrice: !needsCode,
    isAdmin,
    authorize,
  };
};

/**
 * Wraps an emitter's `mutate` as an AuthorizedAction: `build` makes the
 * payload with the code, `onSuccess` runs on success (close the screen…).
 * While the code sheet is open its own spinner replaces the global loader.
 */
export const emitterAction =
  <TVariables, TResp>(
    mutate: (data: TVariables, options?: any) => unknown,
    build: (code?: string) => TVariables,
    onSuccess?: (resp: TResp) => void,
  ): AuthorizedAction =>
  (code) =>
    new Promise<AuthorizationResult>((resolve) => {
      void mutate(build(code), {
        ...(code !== undefined && { showLoader: false }),
        onSuccess: (resp: TResp) => {
          onSuccess?.(resp);
          resolve({ ok: true });
        },
        onError: (resp: { code?: string; msg?: string }) =>
          resolve({ ok: false, code: resp?.code, msg: resp?.msg }),
        onTimeout: () => resolve({ ok: false }),
      });
    });
