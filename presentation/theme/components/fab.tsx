import { useEffect, useState } from "react";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ThemedText } from "./themed-text";
import tw from "../lib/tailwind";

type FabProps = {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  label?: string;
  expanded?: boolean;
  color?: string;
  bgColor?: string;
  bottom?: number;
  right?: number;
};

export default function Fab({
  onPress,
  icon = "add",
  label,
  expanded = true,
  color = "white",
  bgColor = "bg-light-primary",
  bottom = 24,
  right = 24,
}: FabProps) {
  const hasLabel = !!label;
  const [labelWidth, setLabelWidth] = useState(0);
  const progress = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(expanded ? 1 : 0, { duration: 200 });
  }, [expanded, progress]);

  const labelContainerStyle = useAnimatedStyle(() => ({
    width: progress.value * labelWidth,
    marginLeft: progress.value * 8,
    opacity: progress.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tw`absolute rounded-2xl items-center justify-center shadow-lg flex-row`,
        hasLabel ? tw`h-16 px-5` : tw`w-16 h-16`,
        tw`${bgColor}`,
        {
          bottom,
          right,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <Ionicons name={icon} size={hasLabel ? 24 : 30} color={color} />
      {hasLabel && (
        <>
          <ThemedText
            onLayout={(e) => setLabelWidth(e.nativeEvent.layout.width)}
            numberOfLines={1}
            style={[
              tw`text-sm font-semibold`,
              { color, position: "absolute", opacity: 0 },
            ]}
          >
            {label}
          </ThemedText>
          <Animated.View style={[{ overflow: "hidden" }, labelContainerStyle]}>
            <ThemedText
              numberOfLines={1}
              style={[
                tw`text-sm font-semibold`,
                { color, width: labelWidth },
              ]}
            >
              {label}
            </ThemedText>
          </Animated.View>
        </>
      )}
    </Pressable>
  );
}
