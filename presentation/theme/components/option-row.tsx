import { Pressable } from "react-native";

import tw from "../lib/tailwind";
import Icon, { type IconName } from "./icon";
import { ThemedText } from "./themed-text";

interface OptionRowProps {
  icon: IconName;
  label: string;
  /** Current value; falls back to a muted `placeholder` when empty. */
  value?: string;
  placeholder?: string;
  onPress: () => void;
}

/** A quiet, tappable setting row: icon, label, current value, chevron. */
export default function OptionRow({
  icon,
  label,
  value,
  placeholder,
  onPress,
}: OptionRowProps) {
  const hasValue = !!value;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value || placeholder || ""}`}
      style={({ pressed }) => [
        tw`flex-row items-center gap-3 min-h-12`,
        pressed && tw`opacity-60`,
      ]}
    >
      <Icon name={icon} size={18} color={tw.color("gray-500")} />
      <ThemedText>{label}</ThemedText>
      <ThemedText
        type="body2"
        numberOfLines={1}
        style={[
          tw`flex-1 text-right`,
          { color: tw.color(hasValue ? "gray-600" : "gray-400") },
        ]}
      >
        {hasValue ? value : placeholder}
      </ThemedText>
      <Icon name="chevron-right" size={18} color={tw.color("gray-400")} />
    </Pressable>
  );
}
