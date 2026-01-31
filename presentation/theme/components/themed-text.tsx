import { StyleSheet, Text, type TextProps } from "react-native";
import { useThemeColor } from "../hooks/use-theme-color";
import tw, { useDeviceContext } from "twrnc";

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

  return (
    <Text
      style={[
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
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 32,
    height: 32,
  },
  h2: {
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 30,
  },
  h3: {
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 28,
  },
  h4: {
    fontSize: 16,
    fontWeight: "bold",
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
    fontWeight: "800",
  },
  caption: {
    fontSize: 12,
    lineHeight: 14,
    textTransform: "uppercase",
  },
});
