import React from "react";
import tw from "@/presentation/theme/lib/tailwind";
import { Pressable, PressableProps } from "react-native";
import { ThemedView } from "./themed-view";

export default function Card({
  onPress,
  children,
  style,
  ...rest
}: PressableProps) {
  return (
    <ThemedView style={tw`shadow-sm rounded-2xl`}>
      <Pressable
        {...rest}
        style={(state) =>
          [
            tw`p-4 rounded-2xl border border-gray-300`,
            state.pressed && tw`opacity-80`,
            typeof style === 'function' ? style(state) : style,
          ].filter(Boolean)
        }
        onPress={onPress}
      >
        {children}
      </Pressable>
    </ThemedView>
  );
}
