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
};

export const palettes = {
  light,
} satisfies Record<string, Palette>;

export type ThemeName = keyof typeof palettes;

export const DEFAULT_THEME: ThemeName = "light";

/**
 * Per-theme replacements for Tailwind's built-in color scales
 * (e.g. a warmer `gray` on paper), so existing `text-gray-500` style
 * classes follow the theme too. Empty for the light theme.
 */
export const colorScaleOverrides: Record<
  ThemeName,
  Record<string, Record<string, string>>
> = {
  light: {},
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
