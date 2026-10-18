import React, { useEffect, useRef } from "react";
import {
  Modal,
  Pressable,
  Animated,
  StyleSheet,
  StyleProp,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Label, { LabelProps } from "@/presentation/theme/components/label";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { typography } from "@/constants/theme";

export interface PopoverItem {
  label: string;
  value?: any;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Renders the item as a soft status `Label` instead of the icon + text. */
  labelColor?: LabelProps["color"];
  onPress: () => void;
}

export interface AnchorPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PopoverMenuProps {
  items: PopoverItem[];
  onClose: () => void;
  title?: string;
  selectedValue?: any;
  /** Positioning (and width) is up to the parent. */
  style?: StyleProp<ViewStyle>;
}

interface PopoverProps {
  visible: boolean;
  onClose: () => void;
  anchor: AnchorPosition | null;
  items: PopoverItem[];
  title?: string;
  selectedValue?: any;
}

const POPOVER_WIDTH = 180;
const SCREEN_MARGIN = 8;

/**
 * The floating card of a popover: optional title plus a list of items. It
 * animates in when mounted. `Popover` anchors it to a measured point inside a
 * modal; it can also be rendered inline (absolutely positioned by its parent)
 * where window coordinates can't be trusted, e.g. inside a bottom sheet.
 */
export function PopoverMenu({
  items,
  onClose,
  title,
  selectedValue,
  style,
}: PopoverMenuProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const dividerColor = tw.color("gray-200");
  const textColor = useThemeColor({}, "primary");

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 20,
        stiffness: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        tw`rounded-xl border border-gray-200 overflow-hidden bg-surface-container-low `,
        shadows.card,
        style,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {title && (
        <>
          <ThemedText type="small" style={tw`px-4 pt-3 pb-2 text-gray-400`}>
            {title}
          </ThemedText>
          <View
            style={{
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: dividerColor,
            }}
          />
        </>
      )}
      {items.map((item) => {
        const isSelected =
          item.value !== undefined && item.value === selectedValue;
        return (
          <Pressable
            key={item.label}
            onPress={() => {
              item.onPress();
              onClose();
            }}
            style={({ pressed }) => [
              tw`flex-row items-center h-11 px-6`,
              pressed && tw`opacity-60`,
            ]}
          >
            {item.labelColor ? (
              // The Label is a Pressable itself: keep it from swallowing the
              // row's tap
              <View pointerEvents="none" style={tw`flex-1 items-start`}>
                <Label
                  text={item.label}
                  color={item.labelColor}
                  variant="soft"
                />
              </View>
            ) : (
              <>
                {item.icon && (
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={tw.color("text-on-surface-variant")}
                    style={tw`mr-4`}
                  />
                )}
                <ThemedText
                  type="body2"
                  style={[
                    tw`flex-1 text-on-surface`,
                    { fontFamily: typography.medium },
                  ]}
                >
                  {item.label}
                </ThemedText>
              </>
            )}
            {isSelected && (
              <Ionicons
                name="checkmark"
                size={16}
                color={textColor}
                style={tw`ml-2`}
              />
            )}
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

export default function Popover({
  visible,
  onClose,
  anchor,
  items,
  title,
  selectedValue,
}: PopoverProps) {
  const { width: screenWidth } = useWindowDimensions();

  if (!anchor) return null;

  // Position below and right-aligned to the anchor button
  let left = anchor.x + anchor.width - POPOVER_WIDTH;
  let top = anchor.y + anchor.height + 4;

  // Clamp to screen edges
  if (left < SCREEN_MARGIN) left = SCREEN_MARGIN;
  if (left + POPOVER_WIDTH > screenWidth - SCREEN_MARGIN) {
    left = screenWidth - SCREEN_MARGIN - POPOVER_WIDTH;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Full-screen backdrop — tap to dismiss */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      {visible && (
        <PopoverMenu
          items={items}
          onClose={onClose}
          title={title}
          selectedValue={selectedValue}
          style={{ position: "absolute", top, left, width: POPOVER_WIDTH }}
        />
      )}
    </Modal>
  );
}

// Shadow properties have no twrnc equivalents — kept in StyleSheet
const shadows = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
});
