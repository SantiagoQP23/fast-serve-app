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

// Allow consumers to opt-in to the global loader per request.
// The loader is hidden by default; pass { showGlobalLoader: true } to show it.
// Example: restaurantApi.get('/endpoint', { showGlobalLoader: true })
declare module "axios" {
  export interface AxiosRequestConfig {
    showGlobalLoader?: boolean;
  }
}

const restaurantApi = axios.create({
  baseURL: `${API_URL}/api`,
});

restaurantApi.interceptors.request.use(async (config) => {
  if (config.showGlobalLoader) {
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
    if (config.showGlobalLoader) {
      useGlobalStore.getState().decrementHttpActiveRequests();
    }
    return Promise.reject(error);
  }
});

restaurantApi.interceptors.response.use(
  (response) => {
    if (response.config.showGlobalLoader) {
      useGlobalStore.getState().decrementHttpActiveRequests();
    }
    return response;
  },
  (error) => {
    if (error.config?.showGlobalLoader) {
      useGlobalStore.getState().decrementHttpActiveRequests();
    }
    return Promise.reject(error);
  }
);

export { restaurantApi };
