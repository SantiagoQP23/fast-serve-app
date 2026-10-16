import { Stack, useRouter } from "expo-router";
import IconButton from "@/presentation/theme/components/icon-button";
import { usePalette } from "@/presentation/theme/store/useThemeStore";

export default function TablesLayout() {
  const palette = usePalette();
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.text,
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
