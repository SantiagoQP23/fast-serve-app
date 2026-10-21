import { useEffect, useRef } from "react";
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

/**
 * A short scale pop whenever `count` goes up, so an added item registers
 * where the eye already is. Skipped when the system reduces motion.
 */
export function useCountPop(count: number) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const previous = useRef(count);

  useEffect(() => {
    if (count > previous.current && !reduceMotion) {
      scale.set(
        withSequence(
          withTiming(1.2, { duration: 110, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 220, easing: Easing.out(Easing.exp) }),
        ),
      );
    }
    previous.current = count;
  }, [count, reduceMotion, scale]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));
}
