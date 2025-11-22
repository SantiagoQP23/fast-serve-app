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
// Create a client

const queryClient = new QueryClient();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useDeviceContext(tw, {
    observeDeviceColorSchemeChanges: false,
    initialColorScheme: "light",
  });

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <SafeAreaView style={tw`flex-1 bg-white dark:bg-black`}>
          <BottomSheetModalProvider>
            <SocketProvider>
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
                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
            </SocketProvider>
          </BottomSheetModalProvider>
        </SafeAreaView>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
