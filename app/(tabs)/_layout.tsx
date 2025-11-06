import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/presentation/theme/hooks/use-color-scheme";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { status } = useAuthStore();

  if (status === "unauthenticated") {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        // tabBarActiveTintColor: Colors["light"].tint,
        // tabBarStyle: {
        //   backgroundColor: Colors["light"].background,
        // },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons color={color} name="home-outline" size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="tables"
        options={{
          title: "Tables",
          tabBarIcon: ({ color }) => (
            <Ionicons color={color} name="grid-outline" size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => (
            <Ionicons color={color} name="receipt-outline" size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
