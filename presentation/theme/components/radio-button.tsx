import { useEffect, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import tw from "../lib/tailwind";
import { ThemedText } from "./themed-text";

type RadioButtonProps = {
  selected: boolean;
  onPress: () => void;
  label?: string;
  /** Right of the label, e.g. a price; the whole row stays one target. */
  trailing?: ReactNode;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  /** Spoken name; defaults to the label. */
  accessibilityLabel?: string;
};

// Grow the touch area (not the look) to Android's 48dp minimum.
const MIN_TOUCH = 48;

const SIZES = {
  small: { ring: 16, dot: 8 },
  medium: { ring: 20, dot: 10 },
  large: { ring: 24, dot: 12 },
};

/** The ink ring, with a dot that grows in when selected. */
function Ring({
  selected,
  size,
}: {
  selected: boolean;
  size: keyof typeof SIZES;
}) {
  const { ring, dot } = SIZES[size];
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: 150 });
  }, [selected, progress]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }],
  }));

  return (
    <View
      style={[
        tw`items-center justify-center rounded-full border-2 border-primary`,
        { width: ring, height: ring },
      ]}
    >
      <Animated.View
        style={[
          tw`rounded-full bg-primary`,
          { width: dot, height: dot },
          dotStyle,
        ]}
      />
    </View>
  );
}

/**
 * One choice of several where only one can be picked. With a label the
 * whole row is pressable; wrap a set in a view with
 * `accessibilityRole="radiogroup"`.
 */
export default function RadioButton({
  selected,
  onPress,
  label,
  trailing,
  disabled = false,
  size = "medium",
  accessibilityLabel,
}: RadioButtonProps) {
  const hasRow = !!label || !!trailing;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={
        hasRow ? undefined : Math.max(0, (MIN_TOUCH - SIZES[size].ring) / 2)
      }
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) =>
        tw.style(
          // gap-3.5 lines labels up with a medium Checkbox (22 + 12)
          hasRow && "flex-row items-center gap-3.5 min-h-12",
          pressed && !disabled && "opacity-70",
          disabled && "opacity-50",
        )
      }
    >
      <Ring selected={selected} size={size} />
      {!!label && <ThemedText style={tw`flex-1`}>{label}</ThemedText>}
      {trailing}
    </Pressable>
  );
}
