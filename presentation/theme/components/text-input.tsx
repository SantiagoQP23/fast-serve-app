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

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function TextInput({ label, error, icon, ...props }: Props) {
  const textColor = useThemeColor({}, "text");
  return (
    <ThemedView>
      {label && <Text style={tw`text-base text-gray-800 mb-2`}>{label}</Text>}
      <View
        style={tw.style(
          "flex-row items-center",
          "border border-gray-300 rounded-xl px-4 py-2 text-gray-900 bg-white",
          error ? "border-red-500" : "border-gray-300",
        )}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={textColor}
            style={{ marginRight: 10 }}
          />
        )}
        <RNTextInput
          style={tw`flex-1`}
          placeholderTextColor="#9CA3AF"
          {...props}
        />
        {error && <Text style={tw`text-red-500 text-sm mt-1`}>{error}</Text>}
      </View>
    </ThemedView>
  );
}
