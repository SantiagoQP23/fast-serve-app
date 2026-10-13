import { useEffect, useRef, type ReactNode } from "react";
import {
  Keyboard,
  Platform,
  TextInput as RNTextInput,
  View,
  type KeyboardEvent,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import tw from "../lib/tailwind";
import IconButton from "./icon-button";
import TextInput from "./text-input";

const ANDROID_KEYBOARD_ANIMATION_MS = 200;
const IOS_KEYBOARD_ANIMATION_MS = 250;

type FloatingSearchBarProps = Omit<
  TextInputProps,
  "style" | "value" | "onChangeText"
> & {
  value: string;
  onChangeText: (text: string) => void;
  /** Rendered above the bar and lifted with it (e.g. a "go to cart" button). */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Search field pinned to the bottom of its parent that rides above the
 * keyboard instead of being covered by it.
 *
 * It positions itself absolutely, so the parent just needs to fill the screen.
 * The lift is the overlap between the keyboard and the bar's own resting
 * position, measured on screen, so it stays correct under headers, safe-area
 * wrappers or tab bars without needing their sizes.
 */
export default function FloatingSearchBar({
  value,
  onChangeText,
  children,
  style,
  ...inputProps
}: FloatingSearchBarProps) {
  const { t } = useTranslation(["common"]);
  // Measured instead of the animated view so the bar's own lift never feeds
  // back into the measurement.
  const anchorRef = useRef<View>(null);
  const inputRef = useRef<RNTextInput>(null);
  const lift = useSharedValue(0);

  useEffect(() => {
    const moveTo = (offset: number, duration: number) => {
      lift.value = withTiming(offset, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    };

    const onKeyboardShow = (event: KeyboardEvent) => {
      const keyboardTop = event.endCoordinates.screenY;
      anchorRef.current?.measureInWindow((_x, y, _width, height) => {
        const overlap = Math.max(0, y + height - keyboardTop);
        moveTo(
          -overlap,
          event.duration || (Platform.OS === "ios"
            ? IOS_KEYBOARD_ANIMATION_MS
            : ANDROID_KEYBOARD_ANIMATION_MS),
        );
      });
    };

    // iOS announces frame changes before they animate (and also covers the
    // keyboard hiding); Android only reports once the keyboard has settled.
    const subscriptions =
      Platform.OS === "ios"
        ? [Keyboard.addListener("keyboardWillChangeFrame", onKeyboardShow)]
        : [
            Keyboard.addListener("keyboardDidShow", onKeyboardShow),
            Keyboard.addListener("keyboardDidHide", () => {
              moveTo(0, ANDROID_KEYBOARD_ANIMATION_MS);
              // The back gesture closes the keyboard but leaves the field
              // focused; blur it so onBlur reflects that editing has ended.
              inputRef.current?.blur();
            }),
          ];

    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, [lift]);

  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }],
  }));

  return (
    <View
      ref={anchorRef}
      pointerEvents="box-none"
      style={tw`absolute left-0 right-0 bottom-0`}
    >
      <Animated.View
        pointerEvents="box-none"
        style={[tw`px-4 pb-4 gap-3`, liftStyle, style]}
      >
        {children}
        {/* Elevation needs a filled background on the shadow-casting view. */}
        <View style={tw`rounded-3xl bg-light-surface-high shadow-md`}>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            icon="search-outline"
            returnKeyType="search"
            autoCorrect={false}
            trailingIcon={
              value ? (
                <IconButton
                  icon="close-circle-outline"
                  onPress={() => onChangeText("")}
                  accessibilityLabel={t("common:actions.clear")}
                />
              ) : undefined
            }
            {...inputProps}
          />
        </View>
      </Animated.View>
    </View>
  );
}
