import { create } from "zustand";
import {
  authCheckStatus,
  authLogin,
  authGoogleSignIn,
  authLinkGoogleAccount,
  authUpdateProfile,
  authRegister,
  authLogout,
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

export type AuthStatus = "authenticated" | "unauthenticated" | "checking";
export type BootstrapStatus = "idle" | "loading" | "success" | "error";

export interface AuthState {
  status: AuthStatus;
  token?: string;
  user?: User;
  currentRestaurant?: Restaurant;
  bootstrapStatus: BootstrapStatus;
  bootstrapError: Error | null;

  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  linkGoogleAccount: () => Promise<boolean>;
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
  checkStatus: () => Promise<void>;
  logout: () => Promise<void>;
  resetBootstrap: () => void;

  changeStatus: (
    token?: string,
    user?: User,
    currentRestaurant?: Restaurant,
  ) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  // Properties
  status: "checking",
  token: undefined,
  user: undefined,
  restaurant: undefined,
  bootstrapStatus: "idle",
  bootstrapError: null,

  // Actions
  resetBootstrap: () => set({ bootstrapStatus: "idle", bootstrapError: null }),

  changeStatus: async (
    token?: string,
    user?: User,
    currentRestaurant?: Restaurant,
  ) => {
    if (!token || !user) {
      set({
        status: "unauthenticated",
        token: undefined,
        user: undefined,
        bootstrapStatus: "idle",
        bootstrapError: null,
      });
      await SecureStorageAdapter.removeItem("token");
      return false;
    }

    set({
      status: "authenticated",
      token: token,
      user: user,
      currentRestaurant: currentRestaurant,
      bootstrapStatus: currentRestaurant ? "loading" : "idle",
      bootstrapError: null,
    });

    await SecureStorageAdapter.setItem("token", token);

    if (!currentRestaurant) {
      return true;
    }

    try {
      const data = await bootstrapRestaurantData(currentRestaurant.id);

      useMenuStore.getState().setMenu(data.menu, currentRestaurant.id);
      usePaymentMethodsStore
        .getState()
        .setPaymentMethods(data.paymentMethods, currentRestaurant.id);
      usePrintersStore
        .getState()
        .setPrinters(data.printers, currentRestaurant.id);
      useTablesStore.getState().setTables(data.tables, currentRestaurant.id);

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

    return get().changeStatus(resp?.token, resp?.user, resp?.currentRestaurant);
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
        return false;
      }

      const idToken = response.data?.idToken;

      if (!idToken) {
        console.log("Google signin failed: no idToken");
        return false;
      }

      const resp = await authGoogleSignIn(idToken);
      return get().changeStatus(
        resp?.token,
        resp?.user,
        resp?.currentRestaurant,
      );
    } catch (error: any) {
      console.log("Google signin error", error);
      Alert.alert("Google Sign-In Error", JSON.stringify(error, null, 2));
      return false;
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

  linkGoogleAccount: async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (response.type === "cancelled") {
        return false;
      }

      const idToken = response.data?.idToken;

      if (!idToken) {
        console.log("Google signin failed: no idToken");
        return false;
      }

      const resp = await authLinkGoogleAccount(idToken);

      if (!resp) return false;

      set({
        user: resp.user,
        token: resp.token,
      });

      await SecureStorageAdapter.setItem("token", resp.token);

      return true;
    } catch (error: any) {
      console.log("Link Google account error", error);
      Alert.alert("Google Sign-In Error", JSON.stringify(error, null, 2));
      return false;
    }
  },

  checkStatus: async () => {
    const resp = await authCheckStatus();
    get().changeStatus(resp?.token, resp?.user, resp?.currentRestaurant);
  },

  logout: async () => {
    await authLogout();

    useMenuStore.getState().clearMenu();
    usePaymentMethodsStore.getState().clearPaymentMethods();
    usePrintersStore.getState().clearPrinters();
    useTablesStore.getState().clearTables();

    set({
      status: "unauthenticated",
      token: undefined,
      user: undefined,
      bootstrapStatus: "idle",
      bootstrapError: null,
    });
  },
}));
