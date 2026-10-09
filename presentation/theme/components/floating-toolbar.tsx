import { useEffect, useState } from "react";
import { Pressable, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";
import { Colors } from "@/constants/theme";

export interface ToolbarItem {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  label?: string;
}

interface FloatingToolbarProps {
  items: ToolbarItem[];
  orientation?: "horizontal" | "vertical";
  size?: number;
  style?: ViewStyle;
}

const LABEL_GAP = 6;

function ToolbarButton({ item, size }: { item: ToolbarItem; size: number }) {
  const iconSize = Math.round(size * 0.46);
  const paddingHorizontal = (size - iconSize) / 2;
  const color = item.icon
    ? Colors.light.onSecondary
    : Colors.light.onSurfaceVariant;

  const [labelWidth, setLabelWidth] = useState(0);
  const progress = useSharedValue(item.active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(item.active ? 1 : 0, { duration: 200 });
  }, [item.active, progress]);

  const labelContainerStyle = useAnimatedStyle(() => ({
    width: progress.value * labelWidth,
    marginLeft: progress.value * LABEL_GAP,
    opacity: progress.value,
  }));

  return (
    <Pressable
      onPress={item.onPress}
      disabled={item.disabled}
      accessibilityRole="button"
      accessibilityLabel={item.accessibilityLabel ?? item.label}
      style={({ pressed }) => [
        tw`rounded-full items-center justify-center flex-row`,
        { height: size, paddingHorizontal },
        item.active && tw`bg-light-secondary`,
        pressed && !item.disabled && tw`opacity-70`,
        item.disabled && tw`opacity-40`,
      ]}
    >
      <Ionicons name={item.icon} size={iconSize} color={color} />
      {item.label && (
        <>
          {/* Off-screen measurement pass: lets the animated container below
              know its target width before the expand animation starts. */}
          <ThemedText
            onLayout={(e) => setLabelWidth(e.nativeEvent.layout.width)}
            numberOfLines={1}
            type="small"
            style={{ color, position: "absolute", opacity: 0 }}
          >
            {item.label}
          </ThemedText>
          <Animated.View
            style={[{ overflow: "hidden" }, labelContainerStyle]}
          >
            <ThemedText
              numberOfLines={1}
              type="small"
              style={{ color, width: labelWidth }}
            >
              {item.label}
            </ThemedText>
          </Animated.View>
        </>
      )}
    </Pressable>
  );
}

export default function FloatingToolbar({
  items,
  orientation = "horizontal",
  size = 48,
  style,
}: FloatingToolbarProps) {
  const isHorizontal = orientation === "horizontal";

  return (
    <ThemedView
      style={[
        tw`bg-light-surface rounded-full shadow-sm`,
        isHorizontal
          ? tw`flex-row items-center py-2 px-4 gap-2`
          : tw`flex-col items-center px-2 py-3`,
        style,
      ]}
    >
      {items.map((item, index) => (
        <ToolbarButton key={index} item={item} size={size} />
      ))}
    </ThemedView>
  );
}
