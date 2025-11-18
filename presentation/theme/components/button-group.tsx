import React from "react";
import { View, Pressable, Text } from "react-native";
import tw from "../lib/tailwind";
import { ThemedText } from "./themed-text";

export interface ButtonGroupOption {
  label: string;
  value: any;
}

type ButtonGroupProps = {
  options: ButtonGroupOption[];
  selected: any;
  direction?: "horizontal" | "vertical";
  onChange: (value: any) => void;
};

export default function ButtonGroup({
  options,
  selected,
  direction = "horizontal",
  onChange,
}: ButtonGroupProps) {
  const isHorizontal = direction === "horizontal";

  return (
    <View
      style={tw`${isHorizontal ? "flex-row" : "flex-wrap"} bg-gray-100 dark:bg-darksurface p-1 rounded-2xl`}
    >
      {options.map((option, index) => {
        const isActive = selected === option.value;

        return (
          <Pressable
            key={option.label}
            onPress={() => onChange(option.value)}
            style={({ pressed }) =>
              tw.style(
                "flex-1 py-2 rounded-2xl",
                isActive ? "bg-white" : "bg-transparent",
                pressed && "opacity-80",
              )
            }
          >
            <ThemedText
              type="body2"
              style={tw.style(
                "text-center font-semibold",
                // isActive ? "text-white" : "text-gray-700 dark:text-darktext",
              )}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
