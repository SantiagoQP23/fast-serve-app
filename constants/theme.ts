/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    // primary: "#3F72AF",
    // primary: "#1c1c1e",
    primary: "#38608F",
    onPrimary: "#FFFFFF",
    primaryContainer: "#D2E4FF",
    onPrimaryContainer: "#1C4975",
    secondary: "#D7E3F8",
    onSecondary: "#3C4858",

    surface: "#ECEEF4", // cards, lists, inputs
    onSurfaceVariant: "#43474E",
    surfaceHigh: "#E7E8EE",
    // surface: "#FFFFFF", // cards, lists, inputs
    background: "#F8F9FF", // app canvas
    // background: "#F7F7F7", // app canvas

    text: "#191C20", // primary text
    icon: "#64748b",

    tint: "#0977CA",
    tabIconDefault: "#64748b",
    tabIconSelected: "#0977CA",
    border: "#C3C6CF", // default borders
    divider: "#f1f5f9",
  },
  dark: {
    primary: "#205781",
    secondary: "#1cbbb4",
    tertiary: "#1c1c1e",
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
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
