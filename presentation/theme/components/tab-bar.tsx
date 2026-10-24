import { useEffect, useRef } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import tw from "../lib/tailwind";
import { ThemedText, type ThemedTextProps } from "./themed-text";
export interface TabItem<T extends string> {
  label: string;
  value: T;
  count?: number;
}

interface TabBarProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (value: T) => void;
  /** `false` sizes each tab to its label instead of splitting the row. */
  fullWidth?: boolean;
  /** Scrolls horizontally when the tabs overflow; implies `fullWidth={false}`. */
  scrollable?: boolean;
  /** Label text size, e.g. `h3` for a screen-level tab bar. */
  textType?: ThemedTextProps["type"];
}

const SCROLL_EDGE_PADDING = 16;
const INDICATOR_HEIGHT = 2;
const INDICATOR_DURATION = 200;
// Swiping along a fixed (non-scrollable) row changes tab too.
const ROW_SWIPE_ACTIVE_OFFSET_X = 20;
const ROW_SWIPE_FAIL_OFFSET_Y = 12;
const ROW_SWIPE_DISTANCE = 40;
const ROW_SWIPE_VELOCITY = 500;

export default function TabBar<T extends string>({
  tabs,
  activeTab,
  onChange,
  fullWidth = true,
  scrollable = false,
  textType = "body1",
}: TabBarProps<T>) {
  const stretch = fullWidth && !scrollable;
  const scrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef(new Map<T, { x: number; width: number }>());

  // Underline under the active tab, sliding when it changes
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const placeIndicator = (animate: boolean) => {
    const layout = tabLayouts.current.get(activeTab);
    if (!layout) return;
    if (animate && indicatorWidth.value > 0) {
      indicatorX.value = withTiming(layout.x, { duration: INDICATOR_DURATION });
      indicatorWidth.value = withTiming(layout.width, {
        duration: INDICATOR_DURATION,
      });
    } else {
      indicatorX.value = layout.x;
      indicatorWidth.value = layout.width;
    }
  };

  useEffect(() => {
    placeIndicator(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: indicatorWidth.value,
    transform: [{ translateX: indicatorX.value }],
  }));

  // Keep the active tab in view, with a little of the previous one showing.
  useEffect(() => {
    if (!scrollable) return;
    const x = tabLayouts.current.get(activeTab)?.x;
    if (x === undefined) return;
    scrollRef.current?.scrollTo({
      x: Math.max(0, x - SCROLL_EDGE_PADDING),
      animated: true,
    });
  }, [activeTab, scrollable]);

  const items = tabs.map((tab) => {
    const isActive = activeTab === tab.value;
    return (
      <Pressable
        key={tab.value}
        onPress={() => onChange(tab.value)}
        onLayout={(e) => {
          const { x, width } = e.nativeEvent.layout;
          tabLayouts.current.set(tab.value, { x, width });
          if (tab.value === activeTab) placeIndicator(false);
        }}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        style={tw.style(
          stretch && "flex-1",
          "flex-row items-center justify-center py-2 px-1 gap-1.5 border-b-2 border-transparent",
        )}
      >
        <ThemedText
          type={textType}
          numberOfLines={1}
          style={tw.style(
            isActive ? "font-semibold text-primary " : "text-primary ",
          )}
        >
          {tab.label}
        </ThemedText>
        {tab.count !== undefined ? (
          <ThemedText type="body2" style={tw`text-primary`}>
            {tab.count}
          </ThemedText>
        ) : null}
      </Pressable>
    );
  });

  const indicator = (
    <Animated.View
      pointerEvents="none"
      style={[
        tw`absolute left-0 bottom-0 bg-primary`,
        { height: INDICATOR_HEIGHT },
        indicatorStyle,
      ]}
    />
  );

  const activeIndex = tabs.findIndex((tab) => tab.value === activeTab);
  const swipeTo = (direction: 1 | -1) => {
    const next = tabs[activeIndex + direction];
    if (!next) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onChange(next.value);
  };

  const rowSwipe = Gesture.Pan()
    .enabled(tabs.length > 1)
    .activeOffsetX([-ROW_SWIPE_ACTIVE_OFFSET_X, ROW_SWIPE_ACTIVE_OFFSET_X])
    .failOffsetY([-ROW_SWIPE_FAIL_OFFSET_Y, ROW_SWIPE_FAIL_OFFSET_Y])
    .onEnd((e) => {
      const passed =
        Math.abs(e.translationX) > ROW_SWIPE_DISTANCE ||
        Math.abs(e.velocityX) > ROW_SWIPE_VELOCITY;
      if (!passed || e.translationX * e.velocityX < 0) return;
      // Swiping left (negative) goes to the next tab
      runOnJS(swipeTo)(e.translationX < 0 ? 1 : -1);
    });

  if (scrollable) {
    return (
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        style={tw`grow-0`}
        contentContainerStyle={tw`flex-row gap-4`}
      >
        {items}
        {indicator}
      </ScrollView>
    );
  }

  return (
    <GestureDetector gesture={rowSwipe}>
      <View
        accessibilityRole="tablist"
        style={tw.style(
          "flex-row rounded-3xl ",
          !fullWidth && "self-start gap-4",
        )}
      >
        {items}
        {indicator}
      </View>
    </GestureDetector>
  );
}
