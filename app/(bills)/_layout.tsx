import { Stack } from "expo-router";

export default function BillsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="[id]/index"
        options={{ headerShown: true, title: "", headerShadowVisible: false }}
      />
      <Stack.Screen
        name="[id]/payment-method/index"
        options={{
          headerShown: true,
          title: "Payment Method",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="[id]/payment-method/account/index"
        options={{
          headerShown: true,
          title: "Select Account",
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
