import React from "react";
import { Pressable, ViewStyle } from "react-native";
import tw from "../lib/tailwind";
import { typography } from "@/constants/theme";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";

export interface AvatarProps {
  name?: string;
  size?: number;
  style?: ViewStyle;
  onPress?: () => void;
}

export default function Avatar({ name, size = 40, style, onPress }: AvatarProps) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "?";

  const content = (
    <ThemedView
      style={[
        tw`bg-light-primary items-center justify-center rounded-full`,
        { width: size, height: size },
        style,
      ]}
    >
      <ThemedText
        style={[
          tw`text-white`,
          { fontFamily: typography.semibold, fontSize: size * 0.45 },
        ]}
      >
        {initial}
      </ThemedText>
    </ThemedView>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => tw.style(pressed && "opacity-80")}
    >
      {content}
    </Pressable>
  );
}
