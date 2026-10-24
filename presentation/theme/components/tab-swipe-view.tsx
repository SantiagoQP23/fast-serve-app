/* eslint-disable react-hooks/immutability --
 * Gesture-handler worklets mutate Reanimated shared values off the render
 * path by design; these React Compiler rules can't tell a SharedValue's
 * `.value` from a plain React ref and flag that as unsafe, but it's the
 * standard, safe Reanimated pattern. */
import { useEffect, useRef, type ReactNode } from "react";
import {
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { TabItem } from "./tab-bar";

// The pan starts only after a clear sideways move, and gives up on a vertical
// one, so lists keep scrolling and pull-to-refresh keeps working. Swipeable
// cards (10 px) and gesture-handler ScrollViews start earlier, so they win.
const ACTIVE_OFFSET_X = 20;
const FAIL_OFFSET_Y = 12;
// Release past this share of the width, or flick faster, to change tab.
const SWITCH_DISTANCE_RATIO = 0.25;
const SWITCH_VELOCITY = 500;
// The content only follows the finger a little; past the first or last tab
// it barely moves (rubber band).
const FOLLOW_RATIO = 0.35;
const EDGE_RATIO = 0.12;
const MAX_FOLLOW = 72;
// The new tab's content slides in from the side it came from.
const ENTER_OFFSET = 32;
const ENTER_DURATION = 180;

interface TabSwipeViewProps<T extends string> {
  /** Same tabs, active tab and handler given to the `TabBar` above. */
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (value: T) => void;
  enabled?: boolean;
  /**
   * `false` keeps the content still and only switches tab, for content that
   * also holds the tab row itself (e.g. a list with the tabs as a row).
   */
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/** Swipe left or right on the content under a `TabBar` to change tab. */
export default function TabSwipeView<T extends string>({
  tabs,
  activeTab,
  onChange,
  enabled = true,
  animated = true,
  style,
  children,
}: TabSwipeViewProps<T>) {
  const width = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const index = tabs.findIndex((tab) => tab.value === activeTab);
  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < tabs.length - 1;

  const swipeTo = (direction: 1 | -1) => {
    const next = tabs[index + direction];
    if (!next) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onChange(next.value);
  };

  // Any tab change (swipe or tap on the bar) slides the new content in from
  // the side of the tab it came from.
  const prevIndex = useRef(index);
  useEffect(() => {
    const from = prevIndex.current;
    prevIndex.current = index;
    if (!animated || from === index || from < 0 || index < 0) return;
    translateX.value = withSequence(
      withTiming((index > from ? 1 : -1) * ENTER_OFFSET, { duration: 0 }),
      withTiming(0, { duration: ENTER_DURATION }),
    );
    opacity.value = withSequence(
      withTiming(0.4, { duration: 0 }),
      withTiming(1, { duration: ENTER_DURATION }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, animated]);

  const pan = Gesture.Pan()
    .enabled(enabled && tabs.length > 1)
    .activeOffsetX([-ACTIVE_OFFSET_X, ACTIVE_OFFSET_X])
    .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
    .onUpdate((e) => {
      if (!animated) return;
      // Swiping left (negative) goes to the next tab
      const canGo = e.translationX < 0 ? hasNext : hasPrev;
      const follow = e.translationX * (canGo ? FOLLOW_RATIO : EDGE_RATIO);
      translateX.value = Math.max(-MAX_FOLLOW, Math.min(MAX_FOLLOW, follow));
    })
    .onEnd((e) => {
      const passed =
        Math.abs(e.translationX) > width.value * SWITCH_DISTANCE_RATIO ||
        Math.abs(e.velocityX) > SWITCH_VELOCITY;
      // A flick against the drag direction cancels
      const sameWay = e.translationX * e.velocityX >= 0;
      const direction = e.translationX < 0 ? 1 : -1;
      const canGo = direction === 1 ? hasNext : hasPrev;
      if (passed && sameWay && canGo) {
        // Settles back in case the screen doesn't take the change; the slide
        // in from the new tab's side replaces this once it does.
        translateX.value = withTiming(0, { duration: ENTER_DURATION });
        runOnJS(swipeTo)(direction);
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 240 });
      }
    })
    .onFinalize((_e, success) => {
      if (!success) translateX.value = withSpring(0);
    });

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    width.value = e.nativeEvent.layout.width;
  };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        onLayout={onLayout}
        style={[{ flex: 1 }, style, animated && contentStyle]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
