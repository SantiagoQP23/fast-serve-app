import React from "react";
import { Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "../lib/tailwind";

type FabProps = {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  label?: string;
  color?: string;
  bgColor?: string;
  bottom?: number;
  right?: number;
};

export default function Fab({
  onPress,
  icon = "add",
  label,
  color = "white",
  bgColor = "bg-light-primary",
  bottom = 24,
  right = 24,
}: FabProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tw`absolute w-16 h-16 rounded-full items-center justify-center shadow-lg`,
        tw`${bgColor}`,
        {
          bottom,
          right,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <Ionicons name={icon} size={30} color={color} />
      {label && (
        <Text style={tw`text-white text-xs mt-1 font-semibold`}>{label}</Text>
      )}
    </Pressable>
  );
}
