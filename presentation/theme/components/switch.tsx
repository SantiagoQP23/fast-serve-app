// components/Switch.tsx
import { typography } from "@/constants/theme";
import { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import tw from "../lib/tailwind";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";
import { usePalette } from "@/presentation/theme/store/useThemeStore";

type SwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  /** Names the switch for screen readers when there's no visible `label`. */
  accessibilityLabel?: string;
};

const TRACK_WIDTH = 46;
const TRACK_HEIGHT = 26;
const THUMB_SIZE = 22;
const THUMB_INSET = (TRACK_HEIGHT - THUMB_SIZE) / 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_INSET * 2;
// Grows the touch target to 44pt without changing how the track looks.
const HIT_SLOP = (44 - TRACK_HEIGHT) / 2;

/** Pill track with a round thumb, drawn the same on iOS and Android. */
export default function Switch({
  value,
  onValueChange,
  label,
  disabled = false,
  accessibilityLabel,
}: SwitchProps) {
  const palette = usePalette();
  const offColor = tw.color("gray-300") ?? palette.border;
  const onColor = palette.primary;
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 180 });
  }, [value, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [offColor, onColor],
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * THUMB_TRAVEL }],
  }));

  return (
    <ThemedView
      style={[
        tw`flex-row items-center`,
        // Unlabeled switches sit inline, e.g. at the end of an InfoRow.
        !!label && tw`justify-between w-full`,
      ]}
    >
      {label && (
        <ThemedText style={{ fontFamily: typography.medium }} type="body1">
          {label}
        </ThemedText>
      )}
      <Pressable
        onPress={() => onValueChange(!value)}
        disabled={disabled}
        hitSlop={HIT_SLOP}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
        accessibilityLabel={accessibilityLabel ?? label}
        style={disabled && tw`opacity-50`}
      >
        <Animated.View
          style={[
            {
              width: TRACK_WIDTH,
              height: TRACK_HEIGHT,
              borderRadius: TRACK_HEIGHT / 2,
              padding: THUMB_INSET,
            },
            trackStyle,
          ]}
        >
          <Animated.View
            style={[
              {
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: THUMB_SIZE / 2,
                backgroundColor: palette.onPrimary,
              },
              thumbStyle,
            ]}
          />
        </Animated.View>
      </Pressable>
    </ThemedView>
  );
}
