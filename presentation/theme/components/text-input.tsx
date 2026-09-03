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
import { BottomSheetTextInput } from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "./themed-text";
import { typography } from "@/constants/theme";
import { forwardRef } from "react";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  bottomSheet?: boolean;
  leftIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

function TextInput(
  {
    label,
    error,
    icon,
    leftIcon,
    bottomSheet,
    containerStyle,
    style,
    editable = true,
    ...inputProps
  }: Props,
  ref: React.ForwardedRef<RNTextInput>,
) {
  const InputComponent = bottomSheet ? BottomSheetTextInput : RNTextInput;
  return (
    <ThemedView>
      {label && <ThemedText style={tw`ml-3 mb-2 `}>{label}</ThemedText>}
      <View
        style={[
          tw.style(
            "flex-row items-center",
            " rounded-3xl px-3 py-1 text-gray-900 bg-light-surface-high opacity-80",
            error ? "border-red-500" : "border-gray-300",
            !editable && "opacity-50",
          ),
          containerStyle,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            style={[tw`text-gray-500`, { marginRight: 10 }]}
          />
        )}
        <InputComponent
          ref={ref as React.ForwardedRef<RNTextInput>}
          style={[
            tw`flex-1`,
            { fontSize: 16, fontFamily: typography.regular },
            style as StyleProp<TextStyle>,
          ]}
          placeholderTextColor="#9CA3AF"
          {...inputProps}
        />

        {leftIcon && leftIcon}
      </View>
      {error && <Text style={tw`text-red-500 text-sm mt-1`}>{error}</Text>}
    </ThemedView>
  );
}

export default forwardRef(TextInput);
