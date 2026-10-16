import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import { Appearance, Platform } from "react-native";
import * as SystemUI from "expo-system-ui";

import {
  DEFAULT_THEME,
  isDarkTheme,
  palettes,
  type Palette,
  type ThemeName,
} from "@/constants/theme";
import { setTwTheme } from "@/presentation/theme/lib/tailwind";

/**
 * Points tw and the native side (date pickers, alerts, sheets, keyboard,
 * the window behind the app) at the theme.
 */
const applyTheme = (theme: ThemeName) => {
  setTwTheme(theme);
  if (Platform.OS !== "web") {
    Appearance.setColorScheme(isDarkTheme(theme) ? "dark" : "light");
  }
  SystemUI.setBackgroundColorAsync(palettes[theme].background).catch(() => {});
};

interface ThemeStoreState {
  /** Saved per device, not per account. */
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const isThemeName = (value: unknown): value is ThemeName =>
  typeof value === "string" && value in palettes;

export const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ theme: state.theme }),
      merge: (persisted, current) => {
        const theme = (persisted as Partial<ThemeStoreState> | undefined)
          ?.theme;
        return {
          ...current,
          theme: isThemeName(theme) ? theme : current.theme,
        };
      },
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.theme ?? DEFAULT_THEME);
      },
    },
  ),
);

/** The active theme's color roles, for props that need a color value. */
export const usePalette = (): Palette =>
  palettes[useThemeStore((state) => state.theme)];

/** True once the saved theme has been read from storage. */
export const useThemeHydrated = () =>
  useSyncExternalStore(
    useThemeStore.persist.onFinishHydration,
    useThemeStore.persist.hasHydrated,
    () => true,
  );
