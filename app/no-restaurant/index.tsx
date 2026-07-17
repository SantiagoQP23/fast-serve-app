import { useState } from "react";
import Button from "@/presentation/theme/components/button";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { Linking } from "react-native";
import { toast } from "sonner-native";
import { router } from "expo-router";

export default function NoRestaurantScreen() {
  const { t } = useTranslation("auth");
  const { checkStatus, logout, user } = useAuthStore();
  const [isChecking, setIsChecking] = useState(false);

  const handleOpenWeb = async () => {
    const appUrl = process.env.EXPO_PUBLIC_APP_URL;

    if (!appUrl) {
      toast.error("Web URL is not configured");
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
      } else {
        toast.error("Cannot open web version");
      }
    } catch (error) {
      console.error("Error opening web URL:", error);
      toast.error("Failed to open web version");
    }
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      await checkStatus();
      const latestUser = useAuthStore.getState().user;
      if (latestUser?.role) {
        router.replace("/(app)/(tabs)/(orders-module)/my-orders");
      } else {
        toast.info(t("noRestaurant.stillNoRestaurant"));
      }
    } catch {
      toast.error(t("noRestaurant.checkStatusError"));
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    <ScreenLayout style={tw`flex-1 px-6`}>
      <ThemedView style={tw`flex-1 justify-center items-center gap-6`}>
        <Ionicons
          name="business-outline"
          size={80}
          color={tw.color("light-primary")}
        />
        <ThemedView style={tw`gap-2 items-center`}>
          <ThemedText type="h2" style={tw`text-center`}>
            {t("noRestaurant.title")}
          </ThemedText>
          <ThemedText type="body2" style={tw`text-center text-gray-600`}>
            {t("noRestaurant.description")}
          </ThemedText>
        </ThemedView>
        <ThemedView style={tw`w-full mt-4 gap-3`}>
          <Button
            label={t("noRestaurant.goToWeb")}
            onPress={handleOpenWeb}
          />
          <Button
            variant="secondary"
            label={t("noRestaurant.checkStatusAgain")}
            onPress={handleCheckStatus}
            loading={isChecking}
          />
        </ThemedView>
      </ThemedView>

      <ThemedView style={tw`mb-8 w-full`}>
        <Button
          variant="text"
          label={t("profile.logout")}
          onPress={handleLogout}
        />
      </ThemedView>
    </ScreenLayout>
  );
}
