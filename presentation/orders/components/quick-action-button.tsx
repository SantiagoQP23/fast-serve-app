import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";

interface QuickActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export const QuickActionButton = ({
  icon,
  label,
  onPress,
  disabled,
}: QuickActionButtonProps) => {
  return (
    <ThemedView style={tw`gap-2 items-center`}>
      <Pressable
        style={tw`flex items-center gap-2 px-4 py-2 min-w-15 w-20`}
        onPress={onPress}
        disabled={disabled}
      >
        <Ionicons
          name={icon}
          size={26}
          color={disabled ? tw.color("gray-400") : tw.color("light-primary")}
        />
      </Pressable>
      <ThemedText
        type="body2"
        style={tw.style(disabled && "text-gray-400")}
      >
        {label}
      </ThemedText>
    </ThemedView>
  );
};

export default QuickActionButton;
