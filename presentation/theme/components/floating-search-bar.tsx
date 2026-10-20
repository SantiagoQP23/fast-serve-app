import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  TextInput as RNTextInput,
  View,
  type KeyboardEvent,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import tw from "../lib/tailwind";
import IconButton from "./icon-button";
import TextInput from "./text-input";

const IS_ANDROID = Platform.OS === "android";
const ANDROID_KEYBOARD_ANIMATION_MS = 200;
const IOS_KEYBOARD_ANIMATION_MS = 250;
const ANDROID_EARLY_LIFT_MS = 100;
// How long an early lift waits for the keyboard before giving up (e.g. a
// hardware keyboard is attached and no on-screen keyboard ever appears).
const ANDROID_KEYBOARD_WAIT_MS = 1500;
// Android keyboards take roughly this share of the window height. Only used
// for the first early lift, until a real keyboard has been measured; a slight
// overestimate is corrected as soon as the real height is known.
const ANDROID_FALLBACK_OVERLAP_RATIO = 0.42;
// Space on the right of the resting bar left uncovered by the Android tap
// target so the clear button stays tappable.
const CLEAR_BUTTON_RESERVE = 72;

// Remembered across mounts so every early lift after the first is exact.
let lastAndroidOverlap: number | undefined;

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
 *
 * Android note: with `softwareKeyboardLayoutMode: "pan"` the system slides the
 * whole window up to reveal a focused field the keyboard would cover, and does
 * not undo that when the field is moved afterwards. To avoid a double shift,
 * the bar lifts before the keyboard appears: as soon as the resting bar is
 * touched (on the UI thread, so a busy JS thread cannot make it late) and
 * again on focus (for focus that did not start with a touch).
 *
 * Moving the field while a finger is still on it makes Android drop the tap,
 * so while the field is not focused a static, invisible tap target sits where
 * the bar rests. It starts the lift and focuses the field, and stays put when
 * the bar rises. Once focused, the real field handles touches as usual.
 */
export default function FloatingSearchBar({
  value,
  onChangeText,
  children,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: FloatingSearchBarProps) {
  const { t } = useTranslation(["common"]);
  const insets = useSafeAreaInsets();
  const [focused, setFocused] = useState(false);
  // Measured instead of the animated view so the bar's own lift never feeds
  // back into the measurement.
  const anchorRef = useRef<View>(null);
  const inputRef = useRef<RNTextInput>(null);
  const keyboardWait = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lift = useSharedValue(0);
  // Read from the UI thread by the touch gesture below.
  const keyboardOpen = useSharedValue(false);
  const earlyLiftOverlap = useSharedValue(
    lastAndroidOverlap ??
      Dimensions.get("window").height * ANDROID_FALLBACK_OVERLAP_RATIO,
  );

  const moveTo = useCallback(
    (offset: number, duration: number) => {
      lift.set(
        withTiming(offset, {
          duration,
          easing: Easing.out(Easing.cubic),
        }),
      );
    },
    [lift],
  );

  useEffect(() => {
    const onKeyboardShow = (event: KeyboardEvent) => {
      keyboardOpen.set(true);
      clearTimeout(keyboardWait.current);
      const keyboardTop = event.endCoordinates.screenY;
      anchorRef.current?.measureInWindow((_x, y, _width, height) => {
        // On Android measureInWindow leaves out the status bar, which the
        // keyboard's position includes.
        const statusBar = IS_ANDROID ? insets.top : 0;
        const overlap = Math.max(0, y + statusBar + height - keyboardTop);
        if (IS_ANDROID) {
          lastAndroidOverlap = overlap;
          earlyLiftOverlap.set(overlap);
        }
        moveTo(
          -overlap,
          event.duration ||
            (IS_ANDROID
              ? ANDROID_KEYBOARD_ANIMATION_MS
              : IOS_KEYBOARD_ANIMATION_MS),
        );
      });
    };

    // iOS announces frame changes before they animate (and also covers the
    // keyboard hiding); Android only reports once the keyboard has settled.
    const subscriptions = IS_ANDROID
      ? [
          Keyboard.addListener("keyboardDidShow", onKeyboardShow),
          Keyboard.addListener("keyboardDidHide", () => {
            keyboardOpen.set(false);
            moveTo(0, ANDROID_KEYBOARD_ANIMATION_MS);
            // The back gesture closes the keyboard but leaves the field
            // focused; blur it so onBlur reflects that editing has ended.
            inputRef.current?.blur();
          }),
        ]
      : [Keyboard.addListener("keyboardWillChangeFrame", onKeyboardShow)];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
      clearTimeout(keyboardWait.current);
    };
  }, [earlyLiftOverlap, insets.top, keyboardOpen, moveTo]);

  // Touch-down on the resting bar starts the lift on the UI thread, ahead of
  // the keyboard. If no keyboard follows (e.g. the touch turned into a scroll)
  // the bar returns on its own.
  const earlyLiftOnTouch = Gesture.Manual().onTouchesDown(() => {
    "worklet";
    if (!IS_ANDROID || keyboardOpen.get()) return;
    lift.set(
      withSequence(
        withTiming(-earlyLiftOverlap.get(), {
          duration: ANDROID_EARLY_LIFT_MS,
          easing: Easing.out(Easing.cubic),
        }),
        withDelay(
          ANDROID_KEYBOARD_WAIT_MS,
          withTiming(0, { duration: ANDROID_KEYBOARD_ANIMATION_MS }),
        ),
      ),
    );
  });

  const handleFocus: NonNullable<TextInputProps["onFocus"]> = (event) => {
    setFocused(true);
    onFocus?.(event);
    if (!IS_ANDROID || keyboardOpen.get()) return;

    moveTo(-earlyLiftOverlap.get(), ANDROID_EARLY_LIFT_MS);
    clearTimeout(keyboardWait.current);
    keyboardWait.current = setTimeout(() => {
      if (!keyboardOpen.get()) moveTo(0, ANDROID_KEYBOARD_ANIMATION_MS);
    }, ANDROID_KEYBOARD_WAIT_MS);
  };

  const handleBlur: NonNullable<TextInputProps["onBlur"]> = (event) => {
    setFocused(false);
    onBlur?.(event);
    if (!IS_ANDROID || keyboardOpen.get()) return;

    clearTimeout(keyboardWait.current);
    moveTo(0, ANDROID_KEYBOARD_ANIMATION_MS);
  };

  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.get() }],
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
        <View style={tw`rounded-3xl bg-surface-bright shadow-sm`}>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            icon="search"
            returnKeyType="search"
            autoCorrect={false}
            trailingIcon={
              value ? (
                <IconButton
                  icon="circle-x"
                  onPress={() => {
                    onChangeText("");
                    // Keep typing after clearing.
                    inputRef.current?.focus();
                  }}
                  accessibilityLabel={t("common:actions.clear")}
                />
              ) : undefined
            }
            {...inputProps}
            onFocus={handleFocus}
            onBlur={handleBlur}
            containerStyle={tw`bg-surface-bright rounded-3xl`}
          />
        </View>
      </Animated.View>
      {IS_ANDROID && !focused && (
        <GestureDetector gesture={earlyLiftOnTouch}>
          <View
            importantForAccessibility="no"
            style={[
              tw`absolute left-4 bottom-4 h-14`,
              { right: value ? CLEAR_BUTTON_RESERVE : 16 },
            ]}
          >
            <Pressable
              accessible={false}
              style={tw`flex-1`}
              onPress={() => inputRef.current?.focus()}
            />
          </View>
        </GestureDetector>
      )}
    </View>
  );
}
