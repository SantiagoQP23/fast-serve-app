import React from "react";
import { ActivityIndicator } from "react-native";
import { BlurView } from "expo-blur";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useGlobalStore } from "@/presentation/shared/store/useGlobalStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

interface GlobalLoaderProps {
  message?: string;
}

export function GlobalLoader({ message }: GlobalLoaderProps) {
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
        <ActivityIndicator size="large" color="#000" />
        <ThemedText
          type="body1"
          style={{
            color: "#000",
            marginTop: 16,
          }}
        >
          {loaderMessage}
        </ThemedText>
      </BlurView>
    </ThemedView>
  );
}
