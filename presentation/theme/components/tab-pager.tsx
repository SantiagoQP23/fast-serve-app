/* eslint-disable react-hooks/immutability --
 * Gesture-handler worklets mutate Reanimated shared values off the render
 * path by design; these React Compiler rules can't tell a SharedValue's
 * `.value` from a plain React ref and flag that as unsafe, but it's the
 * standard, safe Reanimated pattern. */
import { useEffect, useState, type ReactNode } from "react";
import {
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { TabItem } from "./tab-bar";

// The pan starts only after a clear sideways move, and gives up on a vertical
// one, so lists keep scrolling and pull-to-refresh keeps working. Swipeable
// cards (10 px) and gesture-handler ScrollViews start earlier, so they win.
const ACTIVE_OFFSET_X = 20;
const FAIL_OFFSET_Y = 12;
// Release past this share of the width, or flick faster, to change tab.
const SWITCH_DISTANCE_RATIO = 0.25;
const SWITCH_VELOCITY = 500;
// Past the first or last tab the pages only follow a third of the drag.
const EDGE_RESISTANCE = 3;
const SETTLE_DURATION = 220;

interface TabPagerProps<T extends string> {
  /** Same tabs, active tab and handler given to the `TabBar` above. */
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (value: T) => void;
  /** Content of one tab. Neighbour tabs are rendered too, so they show while
   * dragging; `isActive` tells the one on screen. */
  renderScene: (value: T, isActive: boolean) => ReactNode;
  enabled?: boolean;
  /**
   * `true` (default) keeps tabs mounted once opened, so they keep their
   * scroll and state. `false` mounts only the active tab and its neighbours,
   * for heavy pages (e.g. one menu section each).
   */
  keepVisited?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * The content under a `TabBar` as pages side by side: drag left or right and
 * the next tab's content comes in under the finger.
 */
export default function TabPager<T extends string>({
  tabs,
  activeTab,
  onChange,
  renderScene,
  enabled = true,
  keepVisited = true,
  style,
}: TabPagerProps<T>) {
  const count = tabs.length;
  const index = Math.max(
    0,
    tabs.findIndex((tab) => tab.value === activeTab),
  );
  const width = useSharedValue(0);
  const offset = useSharedValue(0);
  const dragStart = useSharedValue(0);

  const [visited, setVisited] = useState<ReadonlySet<T>>(
    () => new Set([activeTab]),
  );
  // Remember opened tabs (state adjusted during render, not in an effect)
  if (keepVisited && !visited.has(activeTab)) {
    setVisited(new Set([...visited, activeTab]));
  }

  // Tab changed (tap on the bar, or the end of a swipe): settle on its page.
  useEffect(() => {
    if (width.value === 0) return;
    offset.value = withTiming(-index * width.value, {
      duration: SETTLE_DURATION,
    });
  }, [index, width, offset]);

  const onLayout = (e: LayoutChangeEvent) => {
    width.value = e.nativeEvent.layout.width;
    offset.value = -index * width.value;
  };

  const goTo = (target: number) => {
    const next = tabs[target];
    if (next) onChange(next.value);
  };

  const pan = Gesture.Pan()
    .enabled(enabled && count > 1)
    .activeOffsetX([-ACTIVE_OFFSET_X, ACTIVE_OFFSET_X])
    .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
    .onStart(() => {
      dragStart.value = offset.value;
    })
    .onUpdate((e) => {
      const min = -(count - 1) * width.value;
      let next = dragStart.value + e.translationX;
      if (next > 0) next /= EDGE_RESISTANCE;
      if (next < min) next = min + (next - min) / EDGE_RESISTANCE;
      offset.value = next;
    })
    .onEnd((e) => {
      const pageWidth = width.value;
      // Swiping left (negative) goes to the next tab
      let target = index;
      if (
        e.translationX < -pageWidth * SWITCH_DISTANCE_RATIO ||
        e.velocityX < -SWITCH_VELOCITY
      ) {
        target = index + 1;
      } else if (
        e.translationX > pageWidth * SWITCH_DISTANCE_RATIO ||
        e.velocityX > SWITCH_VELOCITY
      ) {
        target = index - 1;
      }
      target = Math.max(0, Math.min(count - 1, target));
      offset.value = withTiming(-target * pageWidth, {
        duration: SETTLE_DURATION,
      });
      if (target !== index) runOnJS(goTo)(target);
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View
        onLayout={onLayout}
        style={[{ flex: 1, overflow: "hidden" }, style]}
      >
        <Animated.View
          style={[
            { flex: 1, flexDirection: "row", width: `${count * 100}%` },
            rowStyle,
          ]}
        >
          {tabs.map((tab, i) => {
            const isActive = i === index;
            const mounted =
              Math.abs(i - index) <= 1 ||
              (keepVisited && visited.has(tab.value));
            return (
              <View
                key={tab.value}
                style={{ width: `${100 / count}%` }}
                importantForAccessibility={
                  isActive ? "auto" : "no-hide-descendants"
                }
                accessibilityElementsHidden={!isActive}
              >
                {mounted ? renderScene(tab.value, isActive) : null}
              </View>
            );
          })}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}
