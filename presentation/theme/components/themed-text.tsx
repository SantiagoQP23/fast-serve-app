import { StyleSheet, Text, type TextProps } from "react-native";
import { useThemeColor } from "../hooks/use-theme-color";

import {
  useFonts,
  Sen_400Regular,
  Sen_500Medium,
  Sen_600SemiBold,
  Sen_700Bold,
} from "@expo-google-fonts/sen";

import { typography } from "@/constants/theme";
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
  let [fontsLoaded] = useFonts({
    Sen_400Regular,
    Sen_500Medium,
    Sen_600SemiBold,
    Sen_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

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
    lineHeight: 32,
    height: 32,
    fontFamily: typography.medium,
  },
  h2: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: typography.medium,
  },
  h3: {
    fontSize: 18,
    lineHeight: 28,
    fontFamily: typography.medium,
  },
  h4: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: typography.medium,
  },
  body1: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: typography.regular,
  },
  body2: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "RobotoMono_400Regular",
  },
  small: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.regular,
    color: tw.color("gray-500"),
  },
  caption: {
    fontSize: 14,
    lineHeight: 14,
    textTransform: "uppercase",
    fontFamily: "Inter600SemiBold",
  },
});
