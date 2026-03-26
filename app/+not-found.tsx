import Button from "@/presentation/theme/components/button";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import tw from "@/presentation/theme/lib/tailwind";
import { router, usePathname } from "expo-router";

export default function NotFound() {
  const pathname = usePathname();
  return (
    <ScreenLayout style={tw`justify-center items-center`}>
      <ThemedText type="h2">404 - Not Found</ThemedText>
      <ThemedText type="body1">
        The page you are looking for does not exist.
      </ThemedText>
      <ThemedText>Path: {pathname}</ThemedText>
      <ThemedView style={tw`flex-row gap-4 mt-4`}>
        <Button
          onPress={() => router.push("/(app)/(tabs)/(orders-module)/my-orders")}
          style={tw`mt-4`}
          label="Go Home"
        />
        <Button
          onPress={() => router.push("/auth/login")}
          style={tw`mt-4`}
          label="Go Login"
        />
      </ThemedView>
    </ScreenLayout>
  );
}
