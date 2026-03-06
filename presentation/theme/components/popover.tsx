import React, { useEffect, useRef } from "react";
import {
  Modal,
  Pressable,
  Animated,
  Dimensions,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";

export interface PopoverItem {
  label: string;
  value?: any;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

export interface AnchorPosition {
  x: number;
  y: number;
  width: number;
  height: number;
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

export default function Popover({
  visible,
  onClose,
  anchor,
  items,
  title,
  selectedValue,
}: PopoverProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const textColor = useThemeColor({}, "text");
  const dividerColor = useThemeColor(
    { light: "#e5e7eb", dark: "#374151" },
    "border" as any,
  );

  useEffect(() => {
    if (visible) {
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
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  if (!anchor) return null;

  const { width: screenWidth } = Dimensions.get("window");

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

      <Animated.View
        style={[
          tw`absolute rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-light-background dark:bg-black`,
          shadows.card,
          {
            top,
            left,
            width: POPOVER_WIDTH,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
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
        {items.map((item, index) => {
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
                tw`flex-row items-center h-11 px-4`,
                pressed && tw`opacity-60`,
                index < items.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: dividerColor,
                },
              ]}
            >
              {item.icon && (
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={textColor}
                  style={tw`mr-2.5`}
                />
              )}
              <ThemedText type="body2" style={tw`flex-1`}>
                {item.label}
              </ThemedText>
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
