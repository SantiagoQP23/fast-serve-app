import { create } from "zustand";
import {
  authCheckStatus,
  authLogin,
  authGoogleSignIn,
  authLinkGoogleAccount,
  authUpdateProfile,
} from "@/core/auth/actions/auth-actions";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { User } from "@/core/auth/models/user.model";
import { Restaurant } from "@/core/common/models/restaurant.model";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

export type AuthStatus = "authenticated" | "unauthenticated" | "checking";

export interface AuthState {
  status: AuthStatus;
  token?: string;
  user?: User;
  currentRestaurant?: Restaurant;

  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  linkGoogleAccount: () => Promise<boolean>;
  updateProfile: (
    firstName?: string,
    lastName?: string,
    email?: string,
    numPhone?: string,
  ) => Promise<{ success: boolean; errorCode?: string }>;
  checkStatus: () => Promise<void>;
  logout: () => Promise<void>;

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

  // Actions
  changeStatus: async (
    token?: string,
    user?: User,
    currentRestaurant?: Restaurant,
  ) => {
    if (!token || !user) {
      set({ status: "unauthenticated", token: undefined, user: undefined });
      await SecureStorageAdapter.removeItem("token");
      return false;
    }

    set({
      status: "authenticated",
      token: token,
      user: user,
      currentRestaurant: currentRestaurant,
    });

    await SecureStorageAdapter.setItem("token", token);

    return true;
  },

  login: async (email: string, password: string) => {
    const resp = await authLogin(email, password);

    return get().changeStatus(resp?.token, resp?.user, resp?.currentRestaurant);
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
      return false;
    }
  },

  checkStatus: async () => {
    const resp = await authCheckStatus();
    get().changeStatus(resp?.token, resp?.user, resp?.currentRestaurant);
  },

  logout: async () => {
    try {
      await GoogleSignin.signOut();
    } catch {
      // Ignore errors if user wasn't signed in with Google
    }

    SecureStorageAdapter.removeItem("token");

    set({ status: "unauthenticated", token: undefined, user: undefined });
  },
}));
