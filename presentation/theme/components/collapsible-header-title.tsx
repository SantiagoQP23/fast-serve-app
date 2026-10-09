import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import { ThemedText } from "./themed-text";
import tw from "../lib/tailwind";
import { typography } from "@/constants/theme";

// Distance (px) the user needs to scroll before the large title has fully
// collapsed into the navigation header, mirroring iOS's large-title behavior.
export const HEADER_COLLAPSE_DISTANCE = 50;

export function useCollapsibleHeaderScroll() {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  return { scrollY, scrollHandler };
}

type CollapsibleLargeTitleProps = {
  scrollY: SharedValue<number>;
  title: string;
  subtitle?: ReactNode;
};

export function CollapsibleLargeTitle({
  scrollY,
  title,
  subtitle,
}: CollapsibleLargeTitleProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_COLLAPSE_DISTANCE],
      [1, 0],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_COLLAPSE_DISTANCE],
      [0, -12],
      Extrapolation.CLAMP,
    );

    return { opacity, transform: [{ translateY }] };
  });

  return (
    <Animated.View style={[tw`gap-2`, animatedStyle]}>
      <ThemedText type="h1">{title}</ThemedText>
      {subtitle}
    </Animated.View>
  );
}

type CollapsibleHeaderTitleProps = {
  scrollY: SharedValue<number>;
  title: string;
  subtitle?: string;
};

export function CollapsibleHeaderTitle({
  scrollY,
  title,
  subtitle,
}: CollapsibleHeaderTitleProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [HEADER_COLLAPSE_DISTANCE * 0.4, HEADER_COLLAPSE_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(
      scrollY.value,
      [HEADER_COLLAPSE_DISTANCE * 0.4, HEADER_COLLAPSE_DISTANCE],
      [8, 0],
      Extrapolation.CLAMP,
    );

    return { opacity, transform: [{ translateY }] };
  });

  return (
    <Animated.View style={[tw`items-center`, animatedStyle]}>
      <ThemedText style={styles.title} numberOfLines={1}>
        {title}
      </ThemedText>
      {subtitle && (
        <ThemedText style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </ThemedText>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    lineHeight: 19,
    fontFamily: typography.semibold,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 13,
    fontFamily: typography.regular,
    color: tw.color("gray-500"),
  },
});
