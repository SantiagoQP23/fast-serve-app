import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "@/core/auth/models/user.model";
import { Restaurant } from "@/core/common/models/restaurant.model";

const SESSION_CACHE_KEY = "authSessionCache";

/**
 * Last user and restaurant confirmed by the server, so the app can open with
 * the saved session when there is no internet. The token stays in secure
 * storage; this only holds what's needed to render the app.
 */
export interface SessionCache {
  user: User;
  currentRestaurant?: Restaurant;
}

export const loadSessionCache = async (): Promise<SessionCache | null> => {
  try {
    const raw = await AsyncStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;

    const cache = JSON.parse(raw) as SessionCache;
    return cache?.user ? cache : null;
  } catch (error) {
    console.log("Load session cache error", error);
    return null;
  }
};

export const saveSessionCache = async (cache: SessionCache) => {
  try {
    await AsyncStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.log("Save session cache error", error);
  }
};

export const clearSessionCache = async () => {
  try {
    await AsyncStorage.removeItem(SESSION_CACHE_KEY);
  } catch (error) {
    console.log("Clear session cache error", error);
  }
};
