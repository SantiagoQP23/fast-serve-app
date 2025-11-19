import { Ionicons } from "@expo/vector-icons";
import {
  View,
  TextInput as RNTextInput,
  Text,
  TextInputProps,
} from "react-native";
import tw from "../lib/tailwind";
import { useThemeColor } from "../hooks/use-theme-color";
import { ThemedView } from "./themed-view";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { ThemedText } from "./themed-text";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  bottomSheet?: boolean;
  leftIcon?: React.ReactNode;
}

export default function TextInput({
  label,
  error,
  icon,
  leftIcon,
  ...props
}: Props) {
  const textColor = useThemeColor({}, "text");
  return (
    <ThemedView>
      {label && (
        <ThemedText type="body2" style={tw`font-semibold mb-2`}>
          {label}
        </ThemedText>
      )}
      <View
        style={tw.style(
          "flex-row items-center",
          "border border-gray-300 rounded-xl px-3 py-1 text-gray-900 bg-white",
          error ? "border-red-500" : "border-gray-300",
        )}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            style={[tw`text-gray-500`, { marginRight: 10 }]}
          />
        )}
        {!props.bottomSheet ? (
          <RNTextInput
            style={tw`flex-1`}
            placeholderTextColor="#9CA3AF"
            {...props}
          />
        ) : (
          <BottomSheetTextInput
            style={tw`flex-1`}
            placeholderTextColor="#9CA3AF"
            {...props}
          />
        )}

        {leftIcon && leftIcon}
      </View>
      {error && <Text style={tw`text-red-500 text-sm mt-1`}>{error}</Text>}
    </ThemedView>
  );
}
