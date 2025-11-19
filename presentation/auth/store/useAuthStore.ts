import { create } from "zustand";
import { authCheckStatus, authLogin } from "@/core/auth/actions/auth-actions";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { User } from "@/core/auth/models/user.model";
import { Restaurant } from "@/core/common/models/restaurant.model";

export type AuthStatus = "authenticated" | "unauthenticated" | "checking";

export interface AuthState {
  status: AuthStatus;
  token?: string;
  user?: User;
  currentRestaurant?: Restaurant;

  login: (email: string, password: string) => Promise<boolean>;
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

  checkStatus: async () => {
    const resp = await authCheckStatus();
    get().changeStatus(resp?.token, resp?.user, resp?.currentRestaurant);
  },

  logout: async () => {
    SecureStorageAdapter.removeItem("token");

    set({ status: "unauthenticated", token: undefined, user: undefined });
  },
}));
