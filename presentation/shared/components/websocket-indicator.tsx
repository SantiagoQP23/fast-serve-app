import React, { useContext, useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SocketContext } from "../context/SocketContext";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import tw from "@/presentation/theme/lib/tailwind";

export function WebSocketIndicator() {
  const { online } = useContext(SocketContext);
  const { t } = useTranslation();

  // Animated value for pulse effect
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!online) {
      // Start pulsing animation when offline
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();

      return () => {
        pulse.stop();
        pulseAnim.setValue(1);
      };
    }
  }, [online, pulseAnim]);

  // Only show when connection is down
  if (online) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          tw`bg-red-500 px-3 py-2 rounded-full flex-row items-center shadow-lg`,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Ionicons name="wifi-outline" size={20} color="white" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60, // Below status bar and safe area
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9998, // Below loading indicator (9999) but above everything else
  },
});
