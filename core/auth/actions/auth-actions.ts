import { getApiError } from "@/core/api/api-response";
import { restaurantApi } from "@/core/api/restaurantApi";
import { PushNotificationsService } from "@/core/push-notifications/services/push-notifications.service";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { User } from "../models/user.model";
import { Restaurant } from "@/core/common/models/restaurant.model";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import type { LanguageCode } from "@/core/i18n/i18n.config";

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

/** Resultado de login/registro con Google: datos de sesión o el código de error. */
export interface AuthResult {
  user?: User;
  token?: string;
  currentRestaurant?: Restaurant;
  errorCode?: string;
}

const authFailure = (error: unknown): AuthResult => {
  const apiError = getApiError(error);
  return { errorCode: apiError.fromServer ? apiError.code : undefined };
};

export const authLogin = async (
  username: string,
  password: string,
): Promise<AuthResult> => {
  try {
    const { data } = await restaurantApi.post<AuthResponse>("/auth/login", {
      username,
      password,
    });

    return returnUserToken(data);
  } catch (error) {
    console.log("Auth error", error);
    return authFailure(error);
  }
};

export interface CheckStatusResult {
  user?: User;
  token?: string;
  currentRestaurant?: Restaurant;
  /**
   * true when the server couldn't be reached (no internet, timeout, 5xx).
   * The saved session may still be valid, so it must not be logged out.
   */
  offline?: boolean;
}

export const authCheckStatus = async (): Promise<CheckStatusResult> => {
  try {
    const { data } = await restaurantApi.get<AuthResponse>("/auth/auth-renew");

    return returnUserToken(data);
  } catch (error) {
    const { status } = getApiError(error);
    const serverRejected = status !== undefined && status >= 400 && status < 500;

    return serverRejected ? {} : { offline: true };
  }
};

export const authGoogleSignIn = async (
  idToken: string,
): Promise<AuthResult> => {
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
    return authFailure(error);
  }
};

export const authLinkGoogleAccount = async (
  idToken: string,
): Promise<AuthResult> => {
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
    return authFailure(error);
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
    const apiError = getApiError(error);
    const errorCode = apiError.fromServer ? apiError.code : undefined;
    console.log("Register error", errorCode, apiError.message);
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
    const apiError = getApiError(error);
    const errorCode = apiError.fromServer ? apiError.code : undefined;
    console.log("Update profile error", errorCode, apiError.message);
    return { user: null, errorCode };
  }
};

export const authUpdateLanguage = async (
  language: LanguageCode,
): Promise<{ user: User | null; errorCode?: string }> => {
  try {
    const { data } = await restaurantApi.patch<User>("/auth/me", { language });

    return { user: data };
  } catch (error) {
    const apiError = getApiError(error);
    const errorCode = apiError.fromServer ? apiError.code : undefined;
    console.log("Update language error", errorCode, apiError.message);
    return { user: null, errorCode };
  }
};

export const authDeleteAccount = async (): Promise<{
  success: boolean;
  errorCode?: string;
}> => {
  try {
    await restaurantApi.delete("/users/me");
    return { success: true };
  } catch (error) {
    const apiError = getApiError(error);
    const errorCode = apiError.fromServer ? apiError.code : undefined;
    console.log("Delete account error", errorCode, apiError.message);
    return { success: false, errorCode };
  }
};

export const authChangePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; errorCode?: string }> => {
  try {
    await restaurantApi.patch("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return { success: true };
  } catch (error) {
    const apiError = getApiError(error);
    const errorCode = apiError.fromServer ? apiError.code : undefined;
    console.log("Change password error", errorCode, apiError.message);
    return { success: false, errorCode };
  }
};

export const authSetCredentials = async (
  username: string,
  password: string,
): Promise<{ user: User | null; errorCode?: string }> => {
  try {
    const { data } = await restaurantApi.patch<User>("/auth/set-credentials", {
      username,
      password,
    });

    return { user: data };
  } catch (error) {
    const apiError = getApiError(error);
    const errorCode = apiError.fromServer ? apiError.code : undefined;
    console.log("Set credentials error", errorCode, apiError.message);
    return { user: null, errorCode };
  }
};

export const authChangeEmail = async (
  newEmail: string,
  currentPassword?: string,
  googleIdToken?: string,
): Promise<{ success: boolean; errorCode?: string }> => {
  try {
    await restaurantApi.post("/auth/change-email", {
      newEmail,
      currentPassword,
      googleIdToken,
    });

    return { success: true };
  } catch (error) {
    const apiError = getApiError(error);
    const errorCode = apiError.fromServer ? apiError.code : undefined;
    console.log("Change email error", errorCode, apiError.message);
    return { success: false, errorCode };
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
