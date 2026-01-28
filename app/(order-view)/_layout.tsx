import { Stack } from "expo-router";

export default function OrderViewLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="[id]/index"
        options={{
          headerShown: true,
          title: "Order Details",
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
