import { create } from "zustand";
import {
  authCheckStatus,
  authLogin,
  authGoogleSignIn,
  authLinkGoogleAccount,
  authUpdateProfile,
  authUpdateLanguage,
  authRegister,
  authLogout,
  authDeleteAccount,
  authChangePassword,
  authSetCredentials,
  authChangeEmail,
} from "@/core/auth/actions/auth-actions";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { User } from "@/core/auth/models/user.model";
import { Restaurant } from "@/core/common/models/restaurant.model";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Alert } from "react-native";
import { bootstrapRestaurantData } from "@/core/restaurant/services/bootstrap.service";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import { usePaymentMethodsStore } from "@/presentation/restaurant/store/usePaymentMethodsStore";
import { usePrintersStore } from "@/presentation/printers/store/usePrintersStore";
import { useProductionAreasStore } from "@/presentation/production-areas/store/useProductionAreasStore";
import { useGlobalStore } from "@/presentation/shared/store/useGlobalStore";
import { useOutboxStore } from "@/presentation/offline/store/useOutboxStore";
import {
  AVAILABLE_LANGUAGES,
  type LanguageCode,
} from "@/core/i18n/i18n.config";
import {
  clearSessionCache,
  loadSessionCache,
  saveSessionCache,
} from "./session-cache";

export type AuthStatus = "authenticated" | "unauthenticated" | "checking";
export type BootstrapStatus = "idle" | "loading" | "success" | "error";

export interface AuthState {
  status: AuthStatus;
  token?: string;
  user?: User;
  currentRestaurant?: Restaurant;
  bootstrapStatus: BootstrapStatus;
  bootstrapError: Error | null;
  /**
   * true when the app opened with the saved session because the server
   * couldn't be reached. It is checked again once the connection is back.
   */
  isOfflineSession: boolean;

  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; errorCode?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; errorCode?: string }>;
  linkGoogleAccount: () => Promise<{ success: boolean; errorCode?: string }>;
  register: (
    firstName: string,
    lastName: string,
    username: string,
    email: string,
    password: string,
    numPhone?: string,
  ) => Promise<{ success: boolean; errorCode?: string }>;
  updateProfile: (
    firstName?: string,
    lastName?: string,
    email?: string,
    numPhone?: string,
  ) => Promise<{ success: boolean; errorCode?: string }>;
  /**
   * Merges edited restaurant info into the current restaurant and into the
   * user's restaurant list, so Manage and "Mis restaurantes" show it at once.
   */
  updateCurrentRestaurantInfo: (info: Partial<Restaurant>) => void;
  updateLanguage: (
    language: LanguageCode,
  ) => Promise<{ success: boolean; errorCode?: string }>;
  deleteAccount: () => Promise<{ success: boolean; errorCode?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ success: boolean; errorCode?: string }>;
  setCredentials: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; errorCode?: string }>;
  changeEmail: (
    newEmail: string,
    currentPassword?: string,
  ) => Promise<{ success: boolean; errorCode?: string }>;
  checkStatus: () => Promise<void>;
  revalidateSession: () => Promise<void>;
  logout: () => Promise<void>;
  resetBootstrap: () => void;

  changeStatus: (
    token?: string,
    user?: User,
    currentRestaurant?: Restaurant,
    options?: { background?: boolean },
  ) => Promise<boolean>;
}

/**
 * The language saved on the account wins over the one on this device. Accounts
 * that never saved one (created before this existed) take the device's.
 */
const syncUserLanguage = (user: User) => {
  // The device language comes from AsyncStorage; don't read it before it loads.
  if (!useGlobalStore.persist.hasHydrated()) {
    const unsubscribe = useGlobalStore.persist.onFinishHydration(() => {
      unsubscribe();
      syncUserLanguage(user);
    });
    return;
  }

  const { language, setLanguage } = useGlobalStore.getState();

  if (user.language && user.language in AVAILABLE_LANGUAGES) {
    setLanguage(user.language);
    return;
  }

  authUpdateLanguage(language).then(({ user: updatedUser }) => {
    if (updatedUser && useAuthStore.getState().user?.id === updatedUser.id) {
      useAuthStore.setState({ user: updatedUser });
    }
  });
};

let isRevalidating = false;

type SetAuthState = (partial: Partial<AuthState>) => void;
type GetAuthState = () => AuthState;

/**
 * Keeps the user signed in with the last session the server confirmed (token
 * in secure storage, user and restaurant in the session cache). Returns false
 * when there is nothing saved to restore.
 */
const restoreOfflineSession = async (
  set: SetAuthState,
  get: GetAuthState,
): Promise<boolean> => {
  const token = await SecureStorageAdapter.getItem("token");
  if (!token) return false;

  const state = get();
  const session =
    state.status === "authenticated" && state.user
      ? { user: state.user, currentRestaurant: state.currentRestaurant }
      : await loadSessionCache();

  if (!session) return false;

  set({
    status: "authenticated",
    token,
    user: session.user,
    currentRestaurant: session.currentRestaurant,
    bootstrapStatus:
      state.bootstrapStatus === "loading" ? "idle" : state.bootstrapStatus,
    bootstrapError: null,
    isOfflineSession: true,
  });

  syncUserLanguage(session.user);
  return true;
};

/**
 * Opens the app with the saved session when the menu for its restaurant is
 * already stored (the app ran before with this restaurant). Returns false
 * on a first start, so that one still waits for the server.
 */
const openFromCache = async (
  set: SetAuthState,
): Promise<boolean> => {
  const token = await SecureStorageAdapter.getItem("token");
  if (!token) return false;

  const session = await loadSessionCache();
  const restaurantId = session?.currentRestaurant?.id;
  if (!session || !restaurantId) return false;

  await new Promise<void>((resolve) => {
    const unsubscribe = useMenuStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
    if (useMenuStore.persist.hasHydrated()) {
      unsubscribe();
      resolve();
    }
  });
  if (useMenuStore.getState().restaurantId !== restaurantId) return false;

  set({
    status: "authenticated",
    token,
    user: session.user,
    currentRestaurant: session.currentRestaurant,
    bootstrapStatus: "idle",
    bootstrapError: null,
    isOfflineSession: false,
  });
  syncUserLanguage(session.user);
  return true;
};

let checkStatusInFlight: Promise<void> | null = null;

const runCheckStatus = async (
  set: SetAuthState,
  get: GetAuthState,
): Promise<void> => {
  // With the restaurant's data already on the phone, open the app right
  // away and confirm the session in the background, like the offline mode
  // does, instead of a spinner until every request returns.
  const openedFromCache = await openFromCache(set);

  const resp = await authCheckStatus();

  // No internet: open with the saved session instead of logging out.
  if (resp.offline && (await restoreOfflineSession(set, get))) return;

  await get().changeStatus(resp.token, resp.user, resp.currentRestaurant, {
    background: openedFromCache,
  });
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  // Properties
  status: "checking",
  token: undefined,
  user: undefined,
  restaurant: undefined,
  bootstrapStatus: "idle",
  bootstrapError: null,
  isOfflineSession: false,

  // Actions
  resetBootstrap: () => set({ bootstrapStatus: "idle", bootstrapError: null }),

  changeStatus: async (
    token?: string,
    user?: User,
    currentRestaurant?: Restaurant,
    options?: { background?: boolean },
  ) => {
    if (!token || !user) {
      set({
        status: "unauthenticated",
        token: undefined,
        user: undefined,
        bootstrapStatus: "idle",
        bootstrapError: null,
        isOfflineSession: false,
      });
      await SecureStorageAdapter.removeItem("token");
      await clearSessionCache();
      return false;
    }

    // In the background (session re-checked after being offline) the screens
    // keep showing the cached data instead of the loading screen.
    const bootstrapStatus: BootstrapStatus = options?.background
      ? get().bootstrapStatus
      : currentRestaurant
        ? "loading"
        : "idle";

    set({
      status: "authenticated",
      token: token,
      user: user,
      currentRestaurant: currentRestaurant,
      bootstrapStatus,
      bootstrapError: null,
      isOfflineSession: false,
    });

    await SecureStorageAdapter.setItem("token", token);

    syncUserLanguage(user);

    if (!currentRestaurant) {
      return true;
    }

    try {
      const restaurantId = currentRestaurant.id;

      // Drop data cached for a different restaurant so screens never show
      // the previous restaurant's payment methods or production areas.
      if (usePaymentMethodsStore.getState().restaurantId !== restaurantId) {
        usePaymentMethodsStore.getState().clearPaymentMethods();
      }
      if (useProductionAreasStore.getState().restaurantId !== restaurantId) {
        useProductionAreasStore.getState().clearProductionAreas();
      }

      const data = await bootstrapRestaurantData(restaurantId);

      if (data.menu) useMenuStore.getState().setMenu(data.menu, restaurantId);
      if (data.paymentMethods) {
        usePaymentMethodsStore
          .getState()
          .setPaymentMethods(data.paymentMethods, restaurantId);
      }
      if (data.productionAreas) {
        useProductionAreasStore
          .getState()
          .setProductionAreas(data.productionAreas, restaurantId);
      }
      if (data.printers) {
        usePrintersStore.getState().setPrinters(data.printers, restaurantId);
      }
      if (data.tables) {
        useTablesStore.getState().setTables(data.tables, restaurantId);
      }
      if (data.tableAreas) {
        useTablesStore.getState().setAreas(data.tableAreas);
      }

      if (data.errors.length > 0) {
        throw data.errors[0];
      }

      set({ bootstrapStatus: "success", bootstrapError: null });
      return true;
    } catch (error) {
      console.log("Bootstrap error", error);
      set({
        bootstrapStatus: "error",
        bootstrapError: error instanceof Error ? error : new Error(String(error)),
      });
      // Auth is still valid; caller decides whether to block or retry.
      return true;
    }
  },

  login: async (email: string, password: string) => {
    const resp = await authLogin(email, password);
    if (resp.errorCode) return { success: false, errorCode: resp.errorCode };

    const success = await get().changeStatus(
      resp.token,
      resp.user,
      resp.currentRestaurant,
    );
    return { success };
  },

  register: async (
    firstName: string,
    lastName: string,
    username: string,
    email: string,
    password: string,
    numPhone?: string,
  ) => {
    const { token, user, currentRestaurant, errorCode } = await authRegister({
      firstName,
      lastName,
      username,
      email,
      password,
      numPhone,
    });

    if (errorCode) return { success: false, errorCode };
    if (!token || !user) return { success: false };

    const statusChanged = await get().changeStatus(
      token,
      user,
      currentRestaurant ?? undefined,
    );

    return { success: statusChanged };
  },

  loginWithGoogle: async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (response.type === "cancelled") {
        return { success: false };
      }

      const idToken = response.data?.idToken;

      if (!idToken) {
        console.log("Google signin failed: no idToken");
        return { success: false };
      }

      const resp = await authGoogleSignIn(idToken);
      if (resp.errorCode) return { success: false, errorCode: resp.errorCode };

      const success = await get().changeStatus(
        resp.token,
        resp.user,
        resp.currentRestaurant,
      );
      return { success };
    } catch (error: any) {
      console.log("Google signin error", error);
      Alert.alert("Google Sign-In Error", JSON.stringify(error, null, 2));
      return { success: false };
    }
  },

  updateProfile: async (
    firstName?: string,
    lastName?: string,
    email?: string,
    numPhone?: string,
  ) => {
    const { user: updatedUser, errorCode } = await authUpdateProfile(
      firstName,
      lastName,
      email,
      numPhone,
    );

    if (errorCode) return { success: false, errorCode };
    if (!updatedUser) return { success: false };

    set({
      user: updatedUser,
    });

    return { success: true };
  },

  updateCurrentRestaurantInfo: (info: Partial<Restaurant>) => {
    const { user, currentRestaurant } = get();
    if (!currentRestaurant) return;

    set({
      currentRestaurant: { ...currentRestaurant, ...info },
      user: user && {
        ...user,
        restaurantRoles: (user.restaurantRoles ?? []).map((rr) =>
          rr.restaurant.id === currentRestaurant.id
            ? { ...rr, restaurant: { ...rr.restaurant, ...info } }
            : rr,
        ),
      },
    });
  },

  updateLanguage: async (language: LanguageCode) => {
    await useGlobalStore.getState().setLanguage(language);

    const { user } = get();
    if (!user || user.language === language) return { success: true };

    const { user: updatedUser, errorCode } = await authUpdateLanguage(language);
    if (!updatedUser) {
      // Forget the server value so the next session start uploads this one
      // instead of switching the app back.
      set({ user: { ...user, language: null } });
      return { success: false, errorCode };
    }

    set({ user: updatedUser });
    return { success: true };
  },

  linkGoogleAccount: async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (response.type === "cancelled") {
        return { success: false };
      }

      const idToken = response.data?.idToken;

      if (!idToken) {
        console.log("Google signin failed: no idToken");
        return { success: false };
      }

      const resp = await authLinkGoogleAccount(idToken);

      if (!resp.token || !resp.user)
        return { success: false, errorCode: resp.errorCode };

      set({
        user: resp.user,
        token: resp.token,
      });

      await SecureStorageAdapter.setItem("token", resp.token);

      return { success: true };
    } catch (error: any) {
      console.log("Link Google account error", error);
      Alert.alert("Google Sign-In Error", JSON.stringify(error, null, 2));
      return { success: false };
    }
  },

  checkStatus: () => {
    // Several screens can ask at once (the tabs layout can mount more than
    // once at startup); they share one check instead of repeating it.
    checkStatusInFlight ??= runCheckStatus(set, get).finally(() => {
      checkStatusInFlight = null;
    });
    return checkStatusInFlight;
  },

  revalidateSession: async () => {
    if (isRevalidating) return;
    isRevalidating = true;

    try {
      const resp = await authCheckStatus();
      if (resp.offline) return;

      // Logs out if the server rejected the token (e.g. it expired).
      await get().changeStatus(resp.token, resp.user, resp.currentRestaurant, {
        background: true,
      });
    } finally {
      isRevalidating = false;
    }
  },

  logout: async () => {
    await authLogout();

    useMenuStore.getState().clearMenu();
    usePaymentMethodsStore.getState().clearPaymentMethods();
    useProductionAreasStore.getState().clearProductionAreas();
    usePrintersStore.getState().clearPrinters();
    useTablesStore.getState().clearTables();
    useOutboxStore.getState().clear();
    await clearSessionCache();

    set({
      status: "unauthenticated",
      token: undefined,
      user: undefined,
      bootstrapStatus: "idle",
      bootstrapError: null,
      isOfflineSession: false,
    });
  },

  deleteAccount: async () => {
    const { success, errorCode } = await authDeleteAccount();

    if (!success) {
      return { success: false, errorCode };
    }

    await authLogout();

    useMenuStore.getState().clearMenu();
    usePaymentMethodsStore.getState().clearPaymentMethods();
    useProductionAreasStore.getState().clearProductionAreas();
    usePrintersStore.getState().clearPrinters();
    useTablesStore.getState().clearTables();
    useOutboxStore.getState().clear();
    await clearSessionCache();

    set({
      status: "unauthenticated",
      token: undefined,
      user: undefined,
      currentRestaurant: undefined,
      bootstrapStatus: "idle",
      bootstrapError: null,
      isOfflineSession: false,
    });

    return { success: true };
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return authChangePassword(currentPassword, newPassword);
  },

  setCredentials: async (username: string, password: string) => {
    const { user: updatedUser, errorCode } = await authSetCredentials(
      username,
      password,
    );

    if (errorCode) return { success: false, errorCode };
    if (!updatedUser) return { success: false };

    set({ user: updatedUser });

    return { success: true };
  },

  changeEmail: async (newEmail: string, currentPassword?: string) => {
    const hasLocalPassword =
      get().user?.authProvider?.includes("local") ?? true;

    let googleIdToken: string | undefined;

    if (!hasLocalPassword) {
      try {
        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();

        if (response.type === "cancelled") {
          return { success: false };
        }

        googleIdToken = response.data?.idToken ?? undefined;

        if (!googleIdToken) {
          console.log("Google signin failed: no idToken");
          return { success: false };
        }
      } catch (error: any) {
        console.log("Google signin error", error);
        Alert.alert("Google Sign-In Error", JSON.stringify(error, null, 2));
        return { success: false };
      }
    }

    return authChangeEmail(
      newEmail,
      hasLocalPassword ? currentPassword : undefined,
      googleIdToken,
    );
  },
}));

// Save the session whenever the user or restaurant changes (login, profile
// edits, restaurant switch), so it can be restored without internet.
useAuthStore.subscribe((state, prev) => {
  if (state.status !== "authenticated" || !state.user) return;
  if (
    state.user === prev.user &&
    state.currentRestaurant === prev.currentRestaurant
  ) {
    return;
  }

  void saveSessionCache({
    user: state.user,
    currentRestaurant: state.currentRestaurant,
  });
});
