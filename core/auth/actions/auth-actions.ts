import { AxiosError } from "axios";
import { restaurantApi } from "@/core/api/restaurantApi";
import { PushNotificationsService } from "@/core/push-notifications/services/push-notifications.service";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { User } from "../models/user.model";
import { Restaurant } from "@/core/common/models/restaurant.model";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

export interface AuthResponse {
  token: string;
  user: User;
  currentRestaurant: Restaurant;
}

const returnUserToken = (
  data: AuthResponse,
): {
  user: User;
  token: string;
  currentRestaurant: Restaurant;
} => {
  const { token, user, currentRestaurant } = data;
  const currentRole = data.user.restaurantRoles.find(
    (resRole) => resRole.restaurant.id === data.currentRestaurant?.id,
  )?.role;

  return {
    user: { ...user, role: currentRole },
    token,
    currentRestaurant,
  };
};

export const authLogin = async (username: string, password: string) => {
  try {
    const { data } = await restaurantApi.post<AuthResponse>("/auth/login", {
      username,
      password,
    });

    return returnUserToken(data);
  } catch (error) {
    console.log("Auth error", error);
    // throw new Error('User and/or password not valid');
    return null;
  }
};

export const authCheckStatus = async () => {
  try {
    const { data } = await restaurantApi.get<AuthResponse>("/auth/auth-renew");

    return returnUserToken(data);
  } catch (error) {
    return null;
  }
};

export const authGoogleSignIn = async (idToken: string) => {
  try {
    const { data } = await restaurantApi.post<AuthResponse>(
      "/auth/google-signin",
      {
        idToken,
      },
    );

    return returnUserToken(data);
  } catch (error) {
    console.log("Google auth error", error);
    return null;
  }
};

export const authLinkGoogleAccount = async (idToken: string) => {
  try {
    const { data } = await restaurantApi.post<AuthResponse>(
      "/auth/link-google",
      {
        idToken,
      },
    );

    return returnUserToken(data);
  } catch (error) {
    console.log("Link Google account error", error);
    return null;
  }
};

export interface RegisterUserDto {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  numPhone?: string;
}

export const authRegister = async (
  data: RegisterUserDto,
): Promise<{
  user: User | null;
  token: string | null;
  currentRestaurant: Restaurant | null;
  errorCode?: string;
}> => {
  try {
    const payload = { ...data };
    if (!payload.numPhone || payload.numPhone === "") {
      delete payload.numPhone;
    }

    const { data: respData } = await restaurantApi.post<AuthResponse>(
      "/auth/register",
      payload,
    );

    const result = returnUserToken(respData);
    return {
      user: result.user,
      token: result.token,
      currentRestaurant: result.currentRestaurant,
    };
  } catch (error) {
    const axiosError = error as AxiosError<{
      error?: { code?: string; message?: string };
    }>;
    const errorCode = axiosError.response?.data?.error?.code;
    const message = axiosError.response?.data?.error?.message;
    console.log(
      "Register error",
      errorCode,
      message,
      axiosError.response?.data,
    );
    return { user: null, token: null, currentRestaurant: null, errorCode };
  }
};

export const authUpdateProfile = async (
  firstName?: string,
  lastName?: string,
  email?: string,
  numPhone?: string,
): Promise<{ user: User | null; errorCode?: string }> => {
  try {
    const { data } = await restaurantApi.patch<User>("/auth/me", {
      firstName,
      lastName,
      email,
      numPhone,
    });

    return { user: data };
  } catch (error) {
    const axiosError = error as AxiosError<{
      error?: { code?: string; message?: string };
    }>;
    const errorCode = axiosError.response?.data?.error?.code;
    console.log("Update profile error", errorCode, axiosError.response?.data);
    return { user: null, errorCode };
  }
};

export const authLogout = async () => {
  try {
    const pushToken = await SecureStorageAdapter.getItem("expoPushToken");
    if (pushToken) {
      await PushNotificationsService.unregisterToken({ token: pushToken });
      await SecureStorageAdapter.removeItem("expoPushToken");
    }
  } catch (error) {
    console.log("Unregister push token error", error);
  }

  try {
    await GoogleSignin.signOut();
  } catch {
    // Ignore errors if user wasn't signed in with Google
  }

  await SecureStorageAdapter.removeItem("token");
};
