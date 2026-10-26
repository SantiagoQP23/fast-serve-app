import { Stack, useRouter } from "expo-router";
import IconButton from "@/presentation/theme/components/icon-button";
import { usePalette } from "@/presentation/theme/store/useThemeStore";

export default function TransactionLayout() {
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
        name="index"
        options={{
          headerShown: true,
          title: "",
          headerShadowVisible: false,
          headerLeft: () => (
            <IconButton
              icon="arrow-left"
              onPress={() => router.back()}
              style={{ marginRight: 10 }}
            />
          ),
        }}
      />
      <Stack.Screen
        name="[id]/index"
        options={{
          headerShown: true,
          title: "",
          headerShadowVisible: false,
          headerLeft: () => (
            <IconButton
              icon="arrow-left"
              onPress={() => router.back()}
              style={{ marginRight: 10 }}
            />
          ),
        }}
      />
    </Stack>
  );
}
