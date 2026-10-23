import Icon from "@/presentation/theme/components/icon";
import { Pressable, View } from "react-native";
import tw from "../lib/tailwind";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

type CheckboxProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  error?: string;
  size?: "small" | "medium" | "large";
  // Tailwind color token (e.g. "green-500") overriding the primary border/fill.
  color?: string;
  /** Spoken name when there's no visible `label`. */
  accessibilityLabel?: string;
};

// Grow the touch area (not the look) to Android's 48dp minimum.
const MIN_TOUCH = 48;

export default function Checkbox({
  value,
  onValueChange,
  label,
  disabled = false,
  error,
  size = "medium",
  color,
  accessibilityLabel,
}: CheckboxProps) {
  const sizeStyles = {
    small: { box: 18, icon: 14 },
    medium: { box: 22, icon: 18 },
    large: { box: 26, icon: 22 },
  };

  const checkboxSize = sizeStyles[size];

  const CheckboxBox = () => (
    <Pressable
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      hitSlop={
        label ? undefined : Math.max(0, (MIN_TOUCH - checkboxSize.box) / 2)
      }
      accessible={!label}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      style={({ pressed }) => [
        tw.style(
          "justify-center items-center border rounded-3xl",
          value ? "bg-primary border-primary" : " border-primary border-2",
          pressed && !disabled && "opacity-80",
          disabled && "opacity-50",
          error && !value && "border-red-500",
        ),
        color && {
          borderColor: tw.color(color),
          backgroundColor: value ? tw.color(color) : undefined,
        },
        {
          width: checkboxSize.box,
          height: checkboxSize.box,
        },
      ]}
    >
      {value && (
        <Icon
          name="check"
          size={checkboxSize.icon}
          color={tw.color("on-primary")}
        />
      )}
    </Pressable>
  );

  // If no label, return just the checkbox
  if (!label) {
    return (
      <View>
        <CheckboxBox />
        {error && (
          <ThemedText style={tw`text-red-500 text-sm mt-1`}>{error}</ThemedText>
        )}
      </View>
    );
  }

  // With label, return full component
  return (
    <ThemedView style={tw`w-full`}>
      <Pressable
        disabled={disabled}
        onPress={() => onValueChange(!value)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: value, disabled }}
        style={({ pressed }) => [
          tw.style(
            "flex-row items-center gap-3 min-h-12",
            pressed && !disabled && "opacity-80",
          ),
        ]}
      >
        <CheckboxBox />
        <ThemedText
          type="body2"
          style={tw.style("font-semibold flex-1", disabled && "opacity-50")}
        >
          {label}
        </ThemedText>
      </Pressable>
      {error && (
        <ThemedText style={tw`text-red-500 text-sm mt-1 ml-9`}>
          {error}
        </ThemedText>
      )}
    </ThemedView>
  );
}
