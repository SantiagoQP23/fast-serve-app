import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useSyncStore } from "@/presentation/sync/store/useSyncStore";
import tw from "@/presentation/theme/lib/tailwind";

export function SyncIndicator() {
  const status = useSyncStore((state) => state.status);
  const { t } = useTranslation();

  const isSyncing = status === "syncing";

  // Animated value for spin effect
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSyncing) {
      const spin = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      );
      spin.start();

      return () => {
        spin.stop();
        spinAnim.setValue(0);
      };
    }
  }, [isSyncing, spinAnim]);

  if (!isSyncing) {
    return null;
  }

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <View
        style={tw`bg-gray-500 px-3 py-2 rounded-full flex-row items-center shadow-lg`}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="sync-outline" size={20} color="white" />
        </Animated.View>
        <ThemedText type="small" style={tw`text-white ml-2`}>
          {t("common:status.syncing")}
        </ThemedText>
      </View>
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
