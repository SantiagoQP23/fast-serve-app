import React from "react";
import { View, Pressable, Text } from "react-native";
import tw from "../lib/tailwind";

type ButtonGroupProps = {
  options: string[];
  selected: string;
  direction?: "horizontal" | "vertical";
  onChange: (value: string) => void;
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
        const isActive = selected === option;

        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={({ pressed }) =>
              tw.style(
                "flex-1 py-2 rounded-2xl",
                isActive ? "bg-light-primary" : "bg-transparent",
                pressed && "opacity-80",
              )
            }
          >
            <Text
              style={tw.style(
                "text-center font-semibold",
                isActive ? "text-white" : "text-gray-700 dark:text-darktext",
              )}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
