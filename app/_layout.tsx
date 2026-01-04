import { useColorScheme } from "@/presentation/theme/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import tw from "@/presentation/theme/lib/tailwind";
import { useDeviceContext } from "twrnc";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import IconButton from "@/presentation/theme/components/icon-button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SocketProvider } from "@/presentation/shared/context/SocketContext";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { useState, useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { useGlobalStore } from "@/presentation/shared/store/useGlobalStore";
import { WebSocketIndicator } from "@/presentation/shared/components/websocket-indicator";

// Initialize i18n
import "@/core/i18n/i18n.config";
import { initializeDayjs } from "@/core/i18n/utils";
import { useActiveOrders } from "@/presentation/orders/hooks/useActiveOrders";

// Create a client

export const queryClient = new QueryClient();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isLoading = useGlobalStore((state) => state.isLoading);
  const language = useGlobalStore((state) => state.language);
  const setLanguage = useGlobalStore((state) => state.setLanguage);

  useDeviceContext(tw, {
    observeDeviceColorSchemeChanges: false,
    initialColorScheme: "light",
  });

  // Initialize i18n and dayjs with stored language
  useEffect(() => {
    initializeDayjs();
    setLanguage(language);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <SafeAreaView style={tw`flex-1 bg-white dark:bg-black`}>
          <SocketProvider>
            <BottomSheetModalProvider>
              <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
              >
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen
                    name="(tabs)"
                    options={{
                      title: "",
                      headerShadowVisible: false,
                    }}
                  />
                  <Stack.Screen
                    name="(new-order)"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="(reports)"
                    options={{
                      headerShown: false,
                    }}
                  />
                </Stack>
                <StatusBar style="auto" />

                {/* WebSocket Connection Indicator */}
                <WebSocketIndicator />

                {isLoading && (
                  <ThemedView
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 9999,
                      backgroundColor: "rgba(0,0,0,0.4)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ActivityIndicator size="large" color="#fff" />
                  </ThemedView>
                )}
              </ThemeProvider>
            </BottomSheetModalProvider>
          </SocketProvider>
        </SafeAreaView>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
