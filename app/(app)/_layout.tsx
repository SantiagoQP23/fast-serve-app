import { Slot } from "expo-router";
import { OrdersModuleProvider } from "./(tabs)/(orders-module)/orders-module.context";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";

export default function AppLayout() {
  return (
    <ThemedView style={tw`flex-1 bg-light-background `}>
      <OrdersModuleProvider>
        <Slot />
      </OrdersModuleProvider>
    </ThemedView>
  );
}
