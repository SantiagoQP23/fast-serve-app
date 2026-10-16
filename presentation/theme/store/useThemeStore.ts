import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  DEFAULT_THEME,
  palettes,
  type Palette,
  type ThemeName,
} from "@/constants/theme";
import { setTwTheme } from "@/presentation/theme/lib/tailwind";

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
        setTwTheme(theme);
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
        return { ...current, theme: isThemeName(theme) ? theme : current.theme };
      },
      onRehydrateStorage: () => (state) => {
        if (state) setTwTheme(state.theme);
      },
    },
  ),
);

/** The active theme's color roles, for props that need a color value. */
export const usePalette = (): Palette =>
  palettes[useThemeStore((state) => state.theme)];
