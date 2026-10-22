import {
  StyleSheet,
  Text,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from "react-native";
import { useThemeColor } from "../hooks/use-theme-color";

import { fontScale, typography } from "@/constants/theme";
import tw from "../lib/tailwind";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "h1" | "h2" | "h3" | "h4" | "body1" | "body2" | "small" | "caption";
  className?: string;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "body1",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  const textStyle: StyleProp<TextStyle> = [
    {
      color,
    },
    type === "h1" ? styles.h1 : undefined,
    type === "h2" ? styles.h2 : undefined,
    type === "h3" ? styles.h3 : undefined,
    type === "h4" ? styles.h4 : undefined,
    type === "body1" ? styles.body1 : undefined,
    type === "body2" ? styles.body2 : undefined,
    type === "small" ? styles.small : undefined,
    type === "caption" ? styles.caption : undefined,
    // Font resolved per render so it follows the font setting. Digits are
    // fixed-width so prices and totals line up (Nunito's already are).
    {
      fontFamily: typography[fontWeights[type]],
      fontVariant: ["tabular-nums"],
    },
    // Muted color resolved per render so it follows the theme
    type === "small" || type === "caption"
      ? { color: tw.color("gray-500") }
      : undefined,
    style,
  ];
  return <Text style={scaleText(textStyle)} {...rest} />;
}

/**
 * Applies the active font's size multiplier to the final style, so sizes from
 * `type`, tw classes and inline styles all follow it. A fixed height (h1)
 * grows with the line height so descenders aren't clipped.
 */
const scaleText = (style: StyleProp<TextStyle>): StyleProp<TextStyle> => {
  if (fontScale === 1) return style;
  const { fontSize = 14, lineHeight, height } = StyleSheet.flatten(style);
  return [
    style,
    {
      fontSize: fontSize * fontScale,
      ...(lineHeight != null && { lineHeight: lineHeight * fontScale }),
      ...(typeof height === "number" &&
        height === lineHeight && { height: height * fontScale }),
    },
  ];
};

const fontWeights: Record<
  NonNullable<ThemedTextProps["type"]>,
  keyof typeof typography
> = {
  h1: "semibold",
  h2: "semibold",
  h3: "semibold",
  h4: "semibold",
  body1: "medium",
  body2: "regular",
  small: "medium",
  caption: "medium",
};

const styles = StyleSheet.create({
  h1: {
    fontSize: 32,
    lineHeight: 40,
    height: 40,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
  },
  h3: {
    fontSize: 22,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    lineHeight: 24,
  },
  body1: {
    fontSize: 16,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    lineHeight: 16,
  },
  caption: {
    fontSize: 14,
    lineHeight: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
