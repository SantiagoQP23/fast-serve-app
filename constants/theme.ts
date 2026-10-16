import { Platform } from "react-native";

/**
 * Color roles shared by every theme. Components use these roles
 * (`bg-surface`, `text-on-surface-variant`, `usePalette().primary`)
 * instead of fixed colors, so the same code works in every theme.
 */
export interface Palette {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  /** Selected/active fill for chips and segmented choices. */
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  /** App canvas. */
  background: string;
  /** Cards, list rows, inputs. */
  surface: string;
  surfaceHigh: string;
  surfaceContainerLow: string;
  /** Raised cards that are plain white in the light theme. */
  surfaceBright: string;

  text: string;
  onSurface: string;
  onSurfaceVariant: string;
  icon: string;
  border: string;
  outlineVariant: string;
  divider: string;
  /** Dark pills on the light themes (connection and sync indicators). */
  inverseSurface: string;
  onInverseSurface: string;
}

const light: Palette = {
  primary: "#38608F",
  onPrimary: "#FFFFFF",
  primaryContainer: "#D2E4FF",
  onPrimaryContainer: "#1C4975",
  secondary: "#D7E3F8",
  onSecondary: "#3C4858",
  secondaryContainer: "#535F70",
  onSecondaryContainer: "#FFFFFF",

  background: "#F8F9FF",
  surface: "#ECEEF4",
  surfaceHigh: "#E7E8EE",
  surfaceContainerLow: "#F2F3FA",
  surfaceBright: "#FFFFFF",

  text: "#191C20",
  onSurface: "#191C20",
  onSurfaceVariant: "#43474E",
  icon: "#64748b",
  border: "#C3C6CF",
  outlineVariant: "#C3C6CF",
  divider: "#f1f5f9",
  inverseSurface: "#6b7280",
  onInverseSurface: "#FFFFFF",
};

/** Warm off-white, like a paper notebook. Same accent family, deeper. */
const paper: Palette = {
  primary: "#2F4A6B",
  onPrimary: "#FFFFFF",
  primaryContainer: "#D9E2EC",
  onPrimaryContainer: "#1E3550",
  secondary: "#DCE3EA",
  onSecondary: "#2F3E50",
  secondaryContainer: "#56606B",
  onSecondaryContainer: "#FFFFFF",

  background: "#F4EFE6",
  surface: "#EAE4D8",
  surfaceHigh: "#E3DCCE",
  surfaceContainerLow: "#F0EADF",
  surfaceBright: "#FBF8F2",

  text: "#2A2722",
  onSurface: "#2A2722",
  onSurfaceVariant: "#4A453D",
  icon: "#7A7266",
  border: "#D6CEBF",
  outlineVariant: "#D6CEBF",
  divider: "#EBE4D7",
  inverseSurface: "#78716c",
  onInverseSurface: "#FFFFFF",
};

/** True black canvas with near-black surfaces and a bright blue accent. */
const black: Palette = {
  primary: "#5C9DFF",
  onPrimary: "#00214A",
  primaryContainer: "#163C78",
  onPrimaryContainer: "#D6E4FF",
  secondary: "#1E3352",
  onSecondary: "#D6E4FF",
  secondaryContainer: "#B4C8E8",
  onSecondaryContainer: "#1A2C45",

  background: "#000000",
  surface: "#121212",
  surfaceHigh: "#1C1C1E",
  surfaceContainerLow: "#0A0A0A",
  surfaceBright: "#161616",

  text: "#F2F2F2",
  onSurface: "#F2F2F2",
  onSurfaceVariant: "#C4C6CF",
  icon: "#8E8E93",
  border: "#2C2C2E",
  outlineVariant: "#3A3A3C",
  divider: "#1A1A1A",
  inverseSurface: "#3A3A3C",
  onInverseSurface: "#F2F2F2",
};

export const palettes = {
  light,
  paper,
  black,
} satisfies Record<string, Palette>;

export type ThemeName = keyof typeof palettes;

export const DEFAULT_THEME: ThemeName = "light";

/** Themes with a dark background, for the status bar and native controls. */
export const isDarkTheme = (theme: ThemeName) => theme === "black";

// Tailwind's default scales, for the families the app uses.
const tailwindScales = {
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
    950: "#450a0a",
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    950: "#052e16",
  },
  emerald: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
    950: "#022c22",
  },
  orange: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
    950: "#431407",
  },
  amber: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
  },
  yellow: {
    50: "#fefce8",
    100: "#fef9c3",
    200: "#fef08a",
    300: "#fde047",
    400: "#facc15",
    500: "#eab308",
    600: "#ca8a04",
    700: "#a16207",
    800: "#854d0e",
    900: "#713f12",
    950: "#422006",
  },
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
  purple: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7e22ce",
    800: "#6b21a8",
    900: "#581c87",
    950: "#3b0764",
  },
};

// Tailwind's warm `stone` scale, used as `gray` on paper.
const stone = {
  50: "#fafaf9",
  100: "#f5f5f4",
  200: "#e7e5e4",
  300: "#d6d3d1",
  400: "#a8a29e",
  500: "#78716c",
  600: "#57534e",
  700: "#44403c",
  800: "#292524",
  900: "#1c1917",
  950: "#0c0a09",
};

// Neutral gray for black: light shades (backgrounds, borders) become dark
// and dark shades (text) become light, keeping the order of emphasis.
const blackGray = {
  50: "#0F0F0F",
  100: "#1A1A1A",
  200: "#262626",
  300: "#3A3A3A",
  400: "#8A8A8A",
  500: "#A3A3A3",
  600: "#BDBDBD",
  700: "#D4D4D4",
  800: "#E5E5E5",
  900: "#F2F2F2",
  950: "#FAFAFA",
};

// On black, pale fills (50-300) take the deep end of the scale, solid
// fills (400-600) stay, and dark text shades (700+) take the light end.
const BLACK_SHADE_MAP: Record<string, number> = {
  50: 950,
  100: 900,
  200: 800,
  300: 700,
  400: 400,
  500: 500,
  600: 500,
  700: 400,
  800: 300,
  900: 200,
  950: 100,
};

const forBlack = (scale: Record<number, string>) =>
  Object.fromEntries(
    Object.keys(BLACK_SHADE_MAP).map((shade) => [
      shade,
      scale[BLACK_SHADE_MAP[shade]],
    ]),
  );

/**
 * Per-theme replacements for Tailwind's built-in color scales, so existing
 * `text-gray-500` / `bg-red-100` classes follow the theme too.
 */
export const colorScaleOverrides: Record<
  ThemeName,
  Record<string, Record<string, string>>
> = {
  light: {},
  paper: { gray: stone },
  black: {
    gray: blackGray,
    ...Object.fromEntries(
      Object.entries(tailwindScales).map(([name, scale]) => [
        name,
        forBlack(scale),
      ]),
    ),
  },
};

/** Colors the theme picker shows as a preview swatch. */
export const themeSwatches: Record<ThemeName, string[]> = {
  light: [light.background, light.surface, light.primary],
  paper: [paper.background, paper.surface, paper.primary],
  black: [black.background, black.surface, black.primary],
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// export const typography = {
//   regular: "RobotoMono_400Regular",
//   medium: "RobotoMono_500Medium",
//   semibold: "RobotoMono_600SemiBold",
//   bold: "RobotoMono_700Bold",
// };

// export const typography = {
//   regular: "Roboto_400Regular",
//   medium: "Roboto_500Medium",
//   semibold: "Roboto_600SemiBold",
//   bold: "Roboto_700Bold",
// };

// export const typography = {
//   regular: "Sen_400Regular",
//   medium: "Sen_500Medium",
//   semibold: "Sen_600SemiBold",
//   bold: "Sen_700Bold",
// };

export const typography = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
};
