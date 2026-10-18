import { Pressable } from "react-native";
import Ionicons, {
  type IoniconsIconName,
} from "@react-native-vector-icons/ionicons/static";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";

interface QuickActionButtonProps {
  icon: IoniconsIconName;
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
        style={tw`flex items-center justify-center gap-2 px-4 py-2 h-16 min-w-16 w-16 bg-surface-bright rounded-full`}
        onPress={onPress}
        disabled={disabled}
      >
        <Ionicons
          name={icon}
          size={26}
          color={disabled ? tw.color("gray-400") : tw.color("primary")}
        />
      </Pressable>
      <ThemedText
        type="small"
        style={[
          tw.style(
            disabled && "text-gray-400",
            "text-on-surface-variant",
          ),
          { fontFamily: typography.medium },
        ]}
      >
        {label}
      </ThemedText>
    </ThemedView>
  );
};

export default QuickActionButton;
