import React from "react";
import { View, Pressable } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import tw from "../lib/tailwind";
import { ThemedText } from "./themed-text";
import { typography } from "@/constants/theme";
import { usePalette } from "@/presentation/theme/store/useThemeStore";

export interface ButtonGroupOption {
  label: string;
  value: any;
  icon?: keyof typeof Ionicons.glyphMap;
}

type ButtonGroupProps = {
  options: ButtonGroupOption[];
  selected: any;
  direction?: "horizontal" | "vertical";
  /** `small` hugs its content instead of stretching to fill the row. */
  size?: "medium" | "small";
  /** Show only the option icons; the label becomes the accessibility label. */
  iconOnly?: boolean;
  onChange: (value: any) => void;
};

export default function ButtonGroup({
  options,
  selected,
  direction = "horizontal",
  size = "medium",
  iconOnly = false,
  onChange,
}: ButtonGroupProps) {
  const palette = usePalette();
  const isHorizontal = direction === "horizontal";
  const isSmall = size === "small";

  return (
    <View
      style={tw`${isHorizontal ? "flex-row" : "flex-wrap"} bg-surface-high  rounded-3xl p-1`}
    >
      {options.map((option) => {
        const isActive = selected === option.value;
        const showIcon = !!option.icon;
        const showLabel = !(iconOnly && showIcon);

        return (
          <Pressable
            key={option.label}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) =>
              tw.style(
                isSmall ? "px-3 py-[8px]" : "flex-1 py-1",
                "rounded-3xl",
                showIcon && "flex-row items-center justify-center gap-2",
                isActive ? "bg-secondary" : "bg-transparent",
                pressed && "opacity-80",
              )
            }
          >
            {showIcon && (
              <Ionicons
                name={option.icon!}
                size={isSmall ? 15 : 20}
                color={
                  isActive ? palette.onSecondary : palette.onSurfaceVariant
                }
              />
            )}
            {showLabel && (
              <ThemedText
                type="body2"
                style={[
                  tw.style("text-center"),
                  { fontFamily: typography.medium },
                ]}
              >
                {option.label}
              </ThemedText>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
