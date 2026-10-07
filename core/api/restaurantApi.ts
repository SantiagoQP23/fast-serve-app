import axios from "axios";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { Platform } from "react-native";
import { useGlobalStore } from "@/presentation/shared/store/useGlobalStore";
import { ApiResponseMeta, isApiResponse } from "./api-response";

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

  export interface AxiosResponse<T = any, D = any, H = {}> {
    /** Paginación u otros datos extra de un ApiResponse. */
    meta?: ApiResponseMeta;
  }
}

/**
 * Versión del formato de respuesta. Con `2` el backend envuelve todas las
 * respuestas en un ApiResponse ({ success, data, error, meta, ... }).
 */
export const API_VERSION = "2";

const restaurantApi = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "X-Api-Version": API_VERSION },
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

    // Desenvuelve el ApiResponse para que `response.data` siga siendo el
    // payload. Si el backend aún responde sin envoltura, no se toca nada.
    if (isApiResponse(response.data)) {
      response.meta = response.data.meta;
      response.data = response.data.data;
    }

    return response;
  },
  (error) => {
    if (error.config?.showGlobalLoader) {
      useGlobalStore.getState().decrementHttpActiveRequests();
    }
    return Promise.reject(error);
  },
);

export { restaurantApi };
