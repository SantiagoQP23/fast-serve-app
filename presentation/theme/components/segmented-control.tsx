import { Pressable, View } from "react-native";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import tw from "../lib/tailwind";
import { ThemedText, type ThemedTextProps } from "./themed-text";
import { typography } from "@/constants/theme";

export interface SegmentedControlItem<T extends string> {
  label: string;
  value: T;
  icon?: IconName;
}

interface SegmentedControlProps<T extends string> {
  items: SegmentedControlItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** `pill` (default) fills a highlighted chip; `text` shows plain tab labels. */
  variant?: "pill" | "text";
  /** Label text size for the `text` variant. Defaults to `h3`. */
  textType?: ThemedTextProps["type"];
}

export default function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  variant = "pill",
  textType = "h3",
}: SegmentedControlProps<T>) {
  if (variant === "text") {
    return (
      <View style={tw`flex-row items-center gap-5`}>
        {items.map((item) => {
          const isActive = value === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => onChange(item.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              hitSlop={8}
              style={({ pressed }) => tw.style("py-1", pressed && "opacity-60")}
            >
              <ThemedText
                type={textType}
                style={[
                  tw.style(isActive ? "text-text" : "text-gray-500"),
                  {
                    fontFamily: isActive
                      ? typography.medium
                      : typography.regular,
                  },
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

  return (
    <View style={tw`flex-row  rounded-3xl  gap-1`}>
      {items.map((item) => {
        const isActive = value === item.value;
        const iconColor = isActive
          ? tw.color("on-primary")
          : tw.color("on-surface-variant");
        const iconName =
          isActive && item.icon?.endsWith("-outline")
            ? (item.icon.replace(
                /-outline$/,
                "",
              ) as IconName)
            : item.icon;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            style={({ pressed }) =>
              tw.style(
                "flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg bg-surface",
                pressed && "opacity-80",
                isActive &&
                  " shadow-sm rounded-3xl bg-secondary-container",
              )
            }
          >
            {iconName && isActive && (
              <Icon name={iconName} size={18} color={iconColor} />
            )}
            <ThemedText
              type="body2"
              style={[
                tw.style(
                  isActive
                    ? "text-on-primary"
                    : "text-on-surface-variant",
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
