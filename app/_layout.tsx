import { router, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { BottomSheetModalProvider } from "@expo/ui/community/bottom-sheet";

import tw from "@/presentation/theme/lib/tailwind";
import { useDeviceContext } from "twrnc";

import { SafeAreaView } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SocketProvider } from "@/presentation/shared/context/SocketContext";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { useState, useEffect } from "react";
import { useGlobalStore } from "@/presentation/shared/store/useGlobalStore";
import { OfflineToast } from "@/presentation/shared/components/offline-toast";
import { RootToaster } from "@/presentation/shared/components/app-toaster";
import { SyncIndicator } from "@/presentation/shared/components/sync-indicator";
import { GlobalLoader } from "@/presentation/shared/components/global-loader";
import { SocketLoaderBottomSheet } from "@/presentation/shared/components/socket-loader-bottom-sheet";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as Device from "expo-device";
import * as ScreenOrientation from "expo-screen-orientation";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";

// Initialize i18n
import "@/core/i18n/i18n.config";
import { initializeDayjs } from "@/core/i18n/utils";
import { usePushNotifications } from "@/presentation/shared/hooks/usePushNotifications";
import { getPalette, isDarkTheme, typography } from "@/constants/theme";
import {
  useThemeHydrated,
  useThemeStore,
} from "@/presentation/theme/store/useThemeStore";
import { usePreserveNavigationOnThemeChange } from "@/presentation/theme/hooks/use-preserve-navigation-on-theme-change";

export const queryClient = new QueryClient();

export const unstable_settings = {
  anchor: "(app)",
};

export default function RootLayout() {
  const language = useGlobalStore((state) => state.language);
  const setLanguage = useGlobalStore((state) => state.setLanguage);
  const theme = useThemeStore((state) => state.theme);
  const font = useThemeStore((state) => state.font);
  const accent = useThemeStore((state) => state.accent);
  const themeHydrated = useThemeHydrated();
  const isRestoringNavigation = usePreserveNavigationOnThemeChange();
  usePushNotifications();

  // Both fonts load up front so switching in Settings is instant and works offline
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  // Detect if user is on auth pages
  const segments = useSegments();
  const isAuthPage = segments[0] === "auth";

  useDeviceContext(tw, {
    observeDeviceColorSchemeChanges: false,
    initialColorScheme: "light",
  });

  // Tablets rotate freely (counter/POS use); phones stay in portrait
  useEffect(() => {
    if (Device.deviceType !== Device.DeviceType.TABLET) {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      ).catch(() => {});
    }
  }, []);

  // Initialize i18n and dayjs with stored language
  useEffect(() => {
    initializeDayjs();
    setLanguage(language);
    console.log(
      "GOOGLE WEB CLIENT ID:",
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    );
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
  }, []);

  // Wait for the saved theme and font so the app doesn't flash the defaults first
  if (!themeHydrated || !fontsLoaded) return null;

  // Conditionally wrap content with SocketProvider
  const renderContent = () => {
    const content = (
      <BottomSheetModalProvider>
        {/* Remount screens on theme, ink or font change so every tw style and
            font name is recomputed.
            The navigator restarts on its initial screen, so keep it hidden
            until the previous navigation state is restored. */}
        <ThemedView
          key={`${theme}-${accent}-${font}`}
          style={tw.style("flex-1", isRestoringNavigation && "opacity-0")}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              headerTitleStyle: { fontFamily: typography.medium },
              headerTintColor: getPalette(theme, accent).text,
              contentStyle: {
                backgroundColor: getPalette(theme, accent).background,
              },
            }}
          >
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
          <StatusBar style={isDarkTheme(theme) ? "light" : "dark"} />

          {/* Offline notice - only on non-auth pages */}
          {!isAuthPage && <OfflineToast />}
          {!isAuthPage && <SyncIndicator />}

          <GlobalLoader />
          <SocketLoaderBottomSheet />
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
        <SafeAreaView style={tw`flex-1 bg-background `}>
          {renderContent()}
        </SafeAreaView>
        <RootToaster />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
