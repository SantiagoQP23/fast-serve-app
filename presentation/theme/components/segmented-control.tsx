import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "../lib/tailwind";
import { ThemedText } from "./themed-text";
import { typography } from "@/constants/theme";

export interface SegmentedControlItem<T extends string> {
  label: string;
  value: T;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface SegmentedControlProps<T extends string> {
  items: SegmentedControlItem<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={tw`flex-row  rounded-3xl  gap-4`}>
      {items.map((item) => {
        const isActive = value === item.value;
        const iconColor = isActive
          ? tw.color("light-primary")
          : tw.color("light-on-surface-variant");
        const iconName =
          isActive && item.icon?.endsWith("-outline")
            ? (item.icon.replace(
                /-outline$/,
                "",
              ) as keyof typeof Ionicons.glyphMap)
            : item.icon;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            style={({ pressed }) =>
              tw.style(
                "flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-3xl bg-white ",
                pressed && "opacity-80",
                isActive && "shadow-sm",
              )
            }
          >
            {iconName && (
              <Ionicons name={iconName} size={18} color={iconColor} />
            )}
            <ThemedText
              type="body2"
              style={[
                tw.style(
                  isActive
                    ? "text-light-primary"
                    : "text-light-on-surface-variant",
                ),
                { fontFamily: typography.medium },
              ]}
            >
              {item.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
