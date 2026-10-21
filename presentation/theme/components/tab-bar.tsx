import { useEffect, useRef } from "react";
import { Pressable, ScrollView, View } from "react-native";
import tw from "../lib/tailwind";
import { ThemedText } from "./themed-text";
import { typography } from "@/constants/theme";
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
}

const SCROLL_EDGE_PADDING = 16;

export default function TabBar<T extends string>({
  tabs,
  activeTab,
  onChange,
  fullWidth = true,
  scrollable = false,
}: TabBarProps<T>) {
  const stretch = fullWidth && !scrollable;
  const scrollRef = useRef<ScrollView>(null);
  const tabX = useRef(new Map<T, number>());

  // Keep the active tab in view, with a little of the previous one showing.
  useEffect(() => {
    if (!scrollable) return;
    const x = tabX.current.get(activeTab);
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
        onLayout={
          scrollable
            ? (e) => tabX.current.set(tab.value, e.nativeEvent.layout.x)
            : undefined
        }
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        style={tw.style(
          stretch && "flex-1",
          "flex-row items-center justify-center py-2 px-1 gap-1.5 border-b-2",
          isActive ? "border-primary" : "border-transparent",
        )}
      >
        <ThemedText
          type="body1"
          numberOfLines={1}
          style={[
            tw.style(
              isActive ? "font-semibold text-primary " : "text-primary ",
            ),
            { fontFamily: typography.medium },
          ]}
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
      </ScrollView>
    );
  }

  return (
    <View
      accessibilityRole="tablist"
      style={tw.style("flex-row rounded-3xl ", !fullWidth && "self-start gap-4")}
    >
      {items}
    </View>
  );
}
