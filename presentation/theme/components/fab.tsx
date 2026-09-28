import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "./themed-text";
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
  const isExtended = !!label;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tw`absolute rounded-2xl items-center justify-center shadow-lg`,
        isExtended
          ? tw`flex-row gap-2 px-5 py-4`
          : tw`w-16 h-16`,
        tw`${bgColor}`,
        {
          bottom,
          right,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <Ionicons name={icon} size={isExtended ? 20 : 30} color={color} />
      {label && (
        <ThemedText style={[tw`text-sm font-semibold`, { color }]}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}
