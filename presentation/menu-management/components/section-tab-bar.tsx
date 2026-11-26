import { type ReactNode, useEffect, useRef } from "react";
import { Pressable, ScrollView } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";

const SCROLL_EDGE_PADDING = 16;
const INDICATOR_HEIGHT = 2;
const INDICATOR_DURATION = 200;

interface SectionTab {
  label: string;
  value: string;
}

interface SectionTabBarProps {
  tabs: SectionTab[];
  activeTab: string;
  onChange: (value: string) => void;
  /** Shown after the active tab's name, e.g. its edit button. */
  activeTrailing?: ReactNode;
}

/**
 * The menu's scrollable section tabs. Looks and moves like the shared
 * `TabBar` (h4 labels, sliding ink underline), which can't hold anything
 * next to a tab's name.
 */
export default function SectionTabBar({
  tabs,
  activeTab,
  onChange,
  activeTrailing,
}: SectionTabBarProps) {
  const scrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef(new Map<string, { x: number; width: number }>());

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

  // Keep the active tab in view, with a little of the previous one showing.
  useEffect(() => {
    placeIndicator(true);
    const x = tabLayouts.current.get(activeTab)?.x;
    if (x === undefined) return;
    scrollRef.current?.scrollTo({
      x: Math.max(0, x - SCROLL_EDGE_PADDING),
      animated: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: indicatorWidth.value,
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      style={tw`grow-0`}
      contentContainerStyle={tw`flex-row gap-4`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <Pressable
            key={tab.value}
            onPress={() => onChange(tab.value)}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              tabLayouts.current.set(tab.value, { x, width });
              // The active tab grows when its trailing button appears
              if (tab.value === activeTab) placeIndicator(false);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={tw`flex-row items-center py-2 px-1 gap-2`}
          >
            <ThemedText
              type="h4"
              numberOfLines={1}
              style={[
                tw`text-on-surface`,
                {
                  fontFamily: isActive
                    ? typography.semibold
                    : typography.medium,
                },
              ]}
            >
              {tab.label}
            </ThemedText>
            {isActive && activeTrailing}
          </Pressable>
        );
      })}
      <Animated.View
        pointerEvents="none"
        style={[
          tw`absolute left-0 bottom-0 bg-primary`,
          { height: INDICATOR_HEIGHT },
          indicatorStyle,
        ]}
      />
    </ScrollView>
  );
}
