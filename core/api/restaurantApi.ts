import axios from "axios";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { Platform } from "react-native";
import { useGlobalStore } from "@/presentation/shared/store/useGlobalStore";

const STAGE = process.env.EXPO_PUBLIC_STAGE || "dev";

export const API_URL =
  STAGE === "prod"
    ? process.env.EXPO_PUBLIC_API_URL
    : Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_API_URL_IOS
      : process.env.EXPO_PUBLIC_API_URL_ANDROID;

// Allow consumers to opt-out of the global loader per request
// Example: restaurantApi.get('/endpoint', { skipGlobalLoader: true })
declare module "axios" {
  export interface AxiosRequestConfig {
    skipGlobalLoader?: boolean;
  }
}

const restaurantApi = axios.create({
  baseURL: `${API_URL}/api`,
});

restaurantApi.interceptors.request.use(async (config) => {
  if (!config.skipGlobalLoader) {
    useGlobalStore.getState().incrementHttpActiveRequests();
  }

  try {
    // Verificar si tenemos un token en el secure storage
    const token = await SecureStorageAdapter.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  } catch (error) {
    if (!config.skipGlobalLoader) {
      useGlobalStore.getState().decrementHttpActiveRequests();
    }
    return Promise.reject(error);
  }
});

restaurantApi.interceptors.response.use(
  (response) => {
    if (!response.config.skipGlobalLoader) {
      useGlobalStore.getState().decrementHttpActiveRequests();
    }
    return response;
  },
  (error) => {
    if (!error.config?.skipGlobalLoader) {
      useGlobalStore.getState().decrementHttpActiveRequests();
    }
    return Promise.reject(error);
  }
);

export { restaurantApi };
