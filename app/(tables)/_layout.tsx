import { Stack, useRouter } from "expo-router";
import IconButton from "@/presentation/theme/components/icon-button";
import { Colors } from "@/constants/theme";

export default function TablesLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: Colors.light.background },
      }}
    >
      <Stack.Screen
        name="[tableId]/index"
        options={{
          headerShown: true,
          title: "",
          headerShadowVisible: false,
          headerLeft: () => (
            <IconButton icon="arrow-back" onPress={() => router.back()} />
          ),
        }}
      />
    </Stack>
  );
}
