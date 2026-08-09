import { useColorScheme } from "@/presentation/theme/hooks/use-color-scheme";
import { Toaster } from "sonner-native";
import { router, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import tw from "@/presentation/theme/lib/tailwind";
import { useDeviceContext } from "twrnc";

import { SafeAreaView } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SocketProvider } from "@/presentation/shared/context/SocketContext";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { useState, useEffect } from "react";
import { useGlobalStore } from "@/presentation/shared/store/useGlobalStore";
import { WebSocketIndicator } from "@/presentation/shared/components/websocket-indicator";
import { GlobalLoader } from "@/presentation/shared/components/global-loader";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// Initialize i18n
import "@/core/i18n/i18n.config";
import { initializeDayjs } from "@/core/i18n/utils";

export const queryClient = new QueryClient();

export const unstable_settings = {
  anchor: "(app)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const language = useGlobalStore((state) => state.language);
  const setLanguage = useGlobalStore((state) => state.setLanguage);

  // Detect if user is on auth pages
  const segments = useSegments();
  const isAuthPage = segments[0] === "auth";

  useDeviceContext(tw, {
    observeDeviceColorSchemeChanges: false,
    initialColorScheme: "light",
  });

  // Initialize i18n and dayjs with stored language
  useEffect(() => {
    initializeDayjs();
    setLanguage(language);

    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
  }, []);

  // Conditionally wrap content with SocketProvider
  const renderContent = () => {
    const content = (
      <BottomSheetModalProvider>
        <ThemedView style={tw`flex-1 `}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="(app)"
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
            <Stack.Screen
              name="auth/login/index"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="auth/register/index"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="no-restaurant/index"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="join-restaurant/index"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="scan-qr-invite/index"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="staff/index"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(order)"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="transaction"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(bills)"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(order-view)"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(profile)"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(tables)"
              options={{
                headerShown: false,
              }}
            />
          </Stack>
          <StatusBar style="auto" />

          {/* WebSocket Connection Indicator - only show on non-auth pages */}
          {!isAuthPage && <WebSocketIndicator />}

          <GlobalLoader />
        </ThemedView>
      </BottomSheetModalProvider>
    );

    // Only wrap with SocketProvider on non-auth pages
    if (isAuthPage) {
      return content;
    }

    return <SocketProvider>{content}</SocketProvider>;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={tw`flex-1`}>
        <SafeAreaView
          style={tw`flex-1 bg-light-background dark:bg-dark-background`}
        >
          {renderContent()}
        </SafeAreaView>
        <Toaster />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
