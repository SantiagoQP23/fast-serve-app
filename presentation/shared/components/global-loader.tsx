import React from "react";
import { ActivityIndicator } from "react-native";
import { BlurView } from "expo-blur";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useGlobalStore } from "@/presentation/shared/store/useGlobalStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import tw from "@/presentation/theme/lib/tailwind";
import { usePalette } from "@/presentation/theme/store/useThemeStore";

interface GlobalLoaderProps {
  message?: string;
}

export function GlobalLoader({ message }: GlobalLoaderProps) {
  const palette = usePalette();
  const { t } = useTranslation();
  const isLoading = useGlobalStore((state) => state.isLoading);
  const httpActiveRequests = useGlobalStore(
    (state) => state.httpActiveRequests,
  );

  const showLoader = isLoading || httpActiveRequests > 0;

  if (!showLoader) {
    return null;
  }

  const loaderMessage = message ?? t("common:status.loading");

  return (
    <ThemedView
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      <BlurView
        intensity={80}
        tint="systemUltraThinMaterial"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ThemedView
          style={tw`bg-surface p-6 rounded-lg items-center`}
        >
          <ActivityIndicator size="large" color={tw.color("primary")} />
          <ThemedText
            type="body1"
            style={{
              color: palette.primary,
              marginTop: 16,
            }}
          >
            {loaderMessage}
          </ThemedText>
        </ThemedView>
      </BlurView>
    </ThemedView>
  );
}
