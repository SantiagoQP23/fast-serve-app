/* eslint-disable react-hooks/refs, react-hooks/immutability --
 * Gesture-handler worklets mutate Reanimated shared values (and read the
 * drag ref) off the render path by design; these React Compiler rules can't
 * tell a SharedValue's `.value` from a plain React ref and flag that as
 * unsafe, but it's the standard, safe Reanimated pattern. */
import { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import tw from "../lib/tailwind";

const THUMB_WIDTH = 4;
const THUMB_OVERHANG = 8;
const GAP = 6;

function clamp(value: number, min: number, max: number) {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

export default function Slider({
  value,
  onValueChange,
  onSlidingComplete,
  minimumValue = 0,
  maximumValue = 1,
  step = 1,
  disabled = false,
  height = 16,
  bgColor = "bg-light-secondary",
  progressColor = "bg-light-primary",
  thumbColor = "bg-light-primary",
  style = "",
}: {
  value: number;
  onValueChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  disabled?: boolean;
  height?: number;
  bgColor?: string;
  progressColor?: string;
  thumbColor?: string;
  style?: string;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const range = maximumValue - minimumValue || 1;
  const isDragging = useRef(false);

  const thumbX = useSharedValue(0);
  const dragStartX = useSharedValue(0);

  const valueToX = (v: number, width: number) =>
    width === 0 ? 0 : clamp(((v - minimumValue) / range) * width, 0, width);

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setTrackWidth(width);
    thumbX.value = valueToX(value, width);
  };

  // External value changes (e.g. resetting the sheet) reposition the thumb,
  // but never while the user is actively dragging it.
  useEffect(() => {
    if (trackWidth > 0 && !isDragging.current) {
      thumbX.value = valueToX(value, trackWidth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, trackWidth]);

  const xToValue = (x: number) => {
    const fraction = trackWidth === 0 ? 0 : x / trackWidth;
    const raw = minimumValue + fraction * range;
    const stepped = Math.round(raw / step) * step;
    return Math.min(Math.max(stepped, minimumValue), maximumValue);
  };

  const setDragging = (dragging: boolean) => {
    isDragging.current = dragging;
  };

  const emitChange = (x: number) => onValueChange?.(xToValue(x));
  const emitComplete = (x: number) => onSlidingComplete?.(xToValue(x));

  const pan = Gesture.Pan()
    .enabled(!disabled && trackWidth > 0)
    .onStart(() => {
      runOnJS(setDragging)(true);
      dragStartX.value = thumbX.value;
    })
    .onUpdate((e) => {
      const next = clamp(dragStartX.value + e.translationX, 0, trackWidth);
      thumbX.value = next;
      runOnJS(emitChange)(next);
    })
    .onEnd(() => {
      runOnJS(emitComplete)(thumbX.value);
      runOnJS(setDragging)(false);
    });

  const tap = Gesture.Tap()
    .enabled(!disabled && trackWidth > 0)
    .onEnd((e) => {
      const next = clamp(e.x, 0, trackWidth);
      thumbX.value = next;
      runOnJS(emitChange)(next);
      runOnJS(emitComplete)(next);
    });

  const gesture = Gesture.Race(pan, tap);

  const fillStyle = useAnimatedStyle(() => ({
    width: Math.max(0, thumbX.value - THUMB_WIDTH / 2 - GAP),
  }));

  const trackStyle = useAnimatedStyle(() => ({
    width: Math.max(0, trackWidth - (thumbX.value + THUMB_WIDTH / 2 + GAP)),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - THUMB_WIDTH / 2 }],
  }));

  const touchHeight = Math.max(44, height + THUMB_OVERHANG * 2 + 16);

  return (
    <GestureDetector gesture={gesture}>
      <View
        onLayout={onLayout}
        accessibilityRole="adjustable"
        accessibilityValue={{
          min: minimumValue,
          max: maximumValue,
          now: value,
        }}
        style={[
          tw`w-full justify-center ${disabled ? "opacity-50" : ""} ${style}`,
          { height: touchHeight },
        ]}
      >
        <View style={{ height }}>
          <Animated.View
            style={[
              tw`${progressColor} rounded-full absolute left-0 top-0`,
              { height },
              fillStyle,
            ]}
          />
          <Animated.View
            style={[
              tw`${bgColor} rounded-full absolute right-0 top-0`,
              { height },
              trackStyle,
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              tw`${thumbColor} rounded-full absolute`,
              {
                width: THUMB_WIDTH,
                height: height + THUMB_OVERHANG * 2,
                top: -THUMB_OVERHANG,
              },
              thumbStyle,
            ]}
          />
        </View>
      </View>
    </GestureDetector>
  );
}
