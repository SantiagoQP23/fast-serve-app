import React from "react";
import { View, Pressable } from "react-native";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import tw from "../lib/tailwind";
import { ThemedText } from "./themed-text";
import { typography } from "@/constants/theme";
import { usePalette } from "@/presentation/theme/store/useThemeStore";

export interface ButtonGroupOption {
  label: string;
  value: any;
  icon?: IconName;
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
      style={tw`${isHorizontal ? "flex-row" : "flex-wrap"}    border border-primary rounded-full`}
    >
      {options.map((option, index) => {
        const isActive = selected === option.value;
        const hasSeparator = index > 0;
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
                "rounded-full",
                isSmall ? "px-3 py-[8px] " : "flex-1 py-2",
                showIcon && "flex-row items-center justify-center gap-2",
                isActive ? "bg-surface-high" : "bg-transparent",
                pressed && "opacity-80",
              )
            }
          >
            {showIcon && (
              <Icon
                name={option.icon!}
                size={isSmall ? 15 : 20}
                color={isActive ? palette.onSurface : palette.onSurfaceVariant}
              />
            )}
            {showLabel && (
              <ThemedText
                type="body2"
                style={[
                  tw.style("text-center"),
                  {
                    fontFamily: isActive
                      ? typography.semibold
                      : typography.medium,
                  },
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
