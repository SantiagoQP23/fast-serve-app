import { Ionicons } from "@expo/vector-icons";
import {
  View,
  TextInput as RNTextInput,
  Text,
  TextInputProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import tw from "../lib/tailwind";
import { ThemedView } from "./themed-view";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { ThemedText } from "./themed-text";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  bottomSheet?: boolean;
  leftIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function TextInput({
  label,
  error,
  icon,
  leftIcon,
  bottomSheet,
  containerStyle,
  style,
  ...inputProps
}: Props) {
  const InputComponent = bottomSheet ? BottomSheetTextInput : RNTextInput;
  return (
    <ThemedView>
      {label && (
        <ThemedText type="body2" style={tw`font-semibold mb-2`}>
          {label}
        </ThemedText>
      )}
      <View
        style={[
          tw.style(
            "flex-row items-center",
            "border border-light-border rounded-xl px-3 py-1 text-gray-900 bg-white",
            error ? "border-red-500" : "border-gray-300",
          ),
          containerStyle,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            style={[tw`text-gray-500`, { marginRight: 10 }]}
          />
        )}
        <InputComponent
          style={[tw`flex-1`, style as StyleProp<TextStyle>]}
          placeholderTextColor="#9CA3AF"
          {...inputProps}
        />

        {leftIcon && leftIcon}
      </View>
      {error && <Text style={tw`text-red-500 text-sm mt-1`}>{error}</Text>}
    </ThemedView>
  );
}
