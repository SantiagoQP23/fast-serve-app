/* eslint-disable react-hooks/immutability --
 * Gesture-handler worklets mutate Reanimated shared values off the render
 * path by design; these React Compiler rules can't tell a SharedValue's
 * `.value` from a plain React ref and flag that as unsafe, but it's the
 * standard, safe Reanimated pattern. */
import { useEffect, useRef, useState, type ReactNode } from "react";
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
  /**
   * For pages inside a parent ScrollView: each page keeps its own content
   * height and the pager takes the active page's, instead of filling the
   * space (`flex: 1`).
   */
  autoHeight?: boolean;
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
  autoHeight = false,
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

  // Measured width, also kept in state so the first measure lands on the
  // active page: a shared value written straight from onLayout can be lost
  // before the row's animated style is attached, leaving a tab that doesn't
  // start first showing the first page's content.
  const [pageWidth, setPageWidth] = useState(0);
  const placedWidth = useRef(0);

  // First measure (or a resize) jumps to the active page; a tab change (tap
  // on the bar, or the end of a swipe) settles on its page.
  useEffect(() => {
    if (pageWidth === 0) return;
    width.value = pageWidth;
    if (placedWidth.current !== pageWidth) {
      placedWidth.current = pageWidth;
      offset.value = -index * pageWidth;
      return;
    }
    offset.value = withTiming(-index * pageWidth, {
      duration: SETTLE_DURATION,
    });
  }, [index, pageWidth, width, offset]);

  const onLayout = (e: LayoutChangeEvent) => {
    setPageWidth(e.nativeEvent.layout.width);
  };

  // autoHeight: each page's own height; the pager follows the active one.
  const [pageHeights, setPageHeights] = useState<Partial<Record<T, number>>>(
    {},
  );
  const onPageLayout = (value: T) => (e: LayoutChangeEvent) => {
    const height = e.nativeEvent.layout.height;
    setPageHeights((current) =>
      current[value] === height ? current : { ...current, [value]: height },
    );
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
        style={[
          autoHeight
            ? { height: pageHeights[activeTab], overflow: "hidden" }
            : { flex: 1, overflow: "hidden" },
          style,
        ]}
      >
        <Animated.View
          style={[
            autoHeight ? { alignItems: "flex-start" } : { flex: 1 },
            { flexDirection: "row", width: `${count * 100}%` },
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
                onLayout={autoHeight ? onPageLayout(tab.value) : undefined}
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
