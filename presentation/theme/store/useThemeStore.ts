import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import { Appearance, Platform } from "react-native";
import * as SystemUI from "expo-system-ui";

import {
  DEFAULT_ACCENT,
  DEFAULT_FONT,
  DEFAULT_THEME,
  isDarkTheme,
  getPalette,
  isAccentName,
  isFontName,
  palettes,
  setTypographyFont,
  type AccentName,
  type FontName,
  type Palette,
  type ThemeName,
} from "@/constants/theme";
import { setTwTheme } from "@/presentation/theme/lib/tailwind";

/**
 * Points tw and the native side (date pickers, alerts, sheets, keyboard,
 * the window behind the app) at the theme and ink.
 */
const applyTheme = (theme: ThemeName, accent: AccentName) => {
  setTwTheme(theme, accent);
  if (Platform.OS !== "web") {
    Appearance.setColorScheme(isDarkTheme(theme) ? "dark" : "light");
  }
  SystemUI.setBackgroundColorAsync(palettes[theme].background).catch(() => {});
};

interface ThemeStoreState {
  /** Saved per device, not per account. */
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  /** Saved per device, like the theme. */
  font: FontName;
  setFont: (font: FontName) => void;
  /** Ink color for the `primary` role, saved per device. */
  accent: AccentName;
  setAccent: (accent: AccentName) => void;
}

const isThemeName = (value: unknown): value is ThemeName =>
  typeof value === "string" && value in palettes;

export const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set, get) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => {
        applyTheme(theme, get().accent);
        set({ theme });
      },
      font: DEFAULT_FONT,
      setFont: (font) => {
        setTypographyFont(font);
        set({ font });
      },
      accent: DEFAULT_ACCENT,
      setAccent: (accent) => {
        applyTheme(get().theme, accent);
        set({ accent });
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        font: state.font,
        accent: state.accent,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<ThemeStoreState> | undefined;
        return {
          ...current,
          theme: isThemeName(saved?.theme) ? saved.theme : current.theme,
          font: isFontName(saved?.font) ? saved.font : current.font,
          accent: isAccentName(saved?.accent) ? saved.accent : current.accent,
        };
      },
      onRehydrateStorage: () => (state) => {
        applyTheme(
          state?.theme ?? DEFAULT_THEME,
          state?.accent ?? DEFAULT_ACCENT,
        );
        setTypographyFont(state?.font ?? DEFAULT_FONT);
      },
    },
  ),
);

/** The active theme's color roles, for props that need a color value. */
export const usePalette = (): Palette => {
  const theme = useThemeStore((state) => state.theme);
  const accent = useThemeStore((state) => state.accent);
  return getPalette(theme, accent);
};

/** True once the saved theme has been read from storage. */
export const useThemeHydrated = () =>
  useSyncExternalStore(
    useThemeStore.persist.onFinishHydration,
    useThemeStore.persist.hasHydrated,
    () => true,
  );
