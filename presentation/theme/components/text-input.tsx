import { Ionicons } from "@expo/vector-icons";
import {
  View,
  TextInput as RNTextInput,
  TextInputProps,
  StyleProp,
  ViewStyle,
  TextStyle,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import tw from "../lib/tailwind";
import { ThemedView } from "./themed-view";
import { BottomSheetTextInput } from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "./themed-text";
import { typography } from "@/constants/theme";
import { forwardRef, useEffect, useState } from "react";

const CONTAINER_HEIGHT = 56;
const LABEL_REST_POSITION = 16;
const LABEL_FLOAT_POSITION = 7;
const LABEL_REST_SIZE = 16;
const LABEL_FLOAT_SIZE = 11;
const INPUT_MARGIN_TOP = 20;

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
    value,
    defaultValue,
    placeholder,
    onFocus,
    onBlur,
    onChangeText,
    ...inputProps
  }: Props,
  ref: React.ForwardedRef<RNTextInput>,
) {
  const InputComponent = bottomSheet ? BottomSheetTextInput : RNTextInput;

  const isControlled = value !== undefined;
  const [uncontrolledHasText, setUncontrolledHasText] =
    useState(!!defaultValue);
  const [isFocused, setIsFocused] = useState(false);

  const hasValue = isControlled
    ? String(value ?? "").length > 0
    : uncontrolledHasText;
  const isFloating = isFocused || hasValue;

  const floatProgress = useSharedValue(isFloating ? 1 : 0);

  useEffect(() => {
    floatProgress.value = withTiming(isFloating ? 1 : 0, { duration: 150 });
  }, [isFloating, floatProgress]);

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    top: interpolate(
      floatProgress.value,
      [0, 1],
      [LABEL_REST_POSITION, LABEL_FLOAT_POSITION],
    ),
    fontSize: interpolate(
      floatProgress.value,
      [0, 1],
      [LABEL_REST_SIZE, LABEL_FLOAT_SIZE],
    ),
  }));

  const labelColor = error
    ? tw.color("red-500")
    : isFocused
      ? tw.color("light-primary")
      : tw.color("gray-500");

  const borderColor = error
    ? tw.color("red-500")
    : isFocused
      ? tw.color("light-primary")
      : "transparent";

  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleChangeText = (text: string) => {
    if (!isControlled) setUncontrolledHasText(text.length > 0);
    onChangeText?.(text);
  };

  return (
    <ThemedView>
      <View
        style={[
          tw.style(
            "flex-row rounded-3xl px-3 bg-light-surface-high",
            !editable && "opacity-50",
          ),
          { minHeight: CONTAINER_HEIGHT, borderWidth: 1, borderColor },
          containerStyle,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            style={[
              tw``,
              { marginRight: 10, marginLeft: 4, alignSelf: "center" },
            ]}
            color={tw.color("light-on-surface-variant")}
          />
        )}
        <View style={[tw`flex-1`, { alignSelf: "stretch" }]}>
          {label && (
            <Animated.Text
              numberOfLines={1}
              style={[
                { position: "absolute", left: 4, right: 0 },
                {
                  fontFamily: typography.medium,
                  color: labelColor,
                  includeFontPadding: false,
                },
                labelAnimatedStyle,
              ]}
            >
              {label}
            </Animated.Text>
          )}
          <InputComponent
            ref={ref as React.ForwardedRef<RNTextInput>}
            style={[
              tw`text-light-on-surface`,
              {
                fontSize: 16,
                fontFamily: typography.medium,
                marginTop: label ? INPUT_MARGIN_TOP : 0,
                paddingVertical: 0,
                includeFontPadding: false,
              },
              style as StyleProp<TextStyle>,
            ]}
            value={value}
            defaultValue={defaultValue}
            placeholder={isFocused ? placeholder : undefined}
            placeholderTextColor={tw.color("light-on-surface-variant")}
            editable={editable}
            onFocus={handleFocus as (e: any) => void}
            onBlur={handleBlur as (e: any) => void}
            onChangeText={handleChangeText}
            {...inputProps}
          />
        </View>
      </View>
      {error && (
        <ThemedText type="small" style={tw`text-red-500 text-sm mt-1 ml-4`}>
          {error}
        </ThemedText>
      )}
    </ThemedView>
  );
}

export default forwardRef(TextInput);
