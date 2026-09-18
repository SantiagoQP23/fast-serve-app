import { ReactNode } from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";

import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "./themed-view";

interface GroupedListProps<T> {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  onItemPress?: (item: T, index: number) => void;
  style?: StyleProp<ViewStyle>;
}

export function GroupedList<T>({
  data,
  keyExtractor,
  renderItem,
  onItemPress,
  style,
}: GroupedListProps<T>) {
  return (
    <ThemedView style={[tw`gap-0.5`, style]}>
      {data.map((item, index) => {
        const isFirst = index === 0;
        const isLast = index === data.length - 1;

        return (
          <ThemedView
            key={keyExtractor(item, index)}
            style={tw.style(
              "bg-light-surface shadow-xs overflow-hidden",
              isFirst ? "rounded-t-3xl" : "rounded-t-md",
              isLast ? "rounded-b-3xl" : "rounded-b-md",
            )}
          >
            <Pressable
              disabled={!onItemPress}
              onPress={onItemPress ? () => onItemPress(item, index) : undefined}
              style={(state) => tw.style("p-4", state.pressed && "opacity-80")}
            >
              {renderItem(item, index)}
            </Pressable>
          </ThemedView>
        );
      })}
    </ThemedView>
  );
}
