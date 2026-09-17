import { router } from "expo-router";
import { toast } from "sonner-native";
import { Ionicons } from "@expo/vector-icons";

import tw from "@/presentation/theme/lib/tailwind";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useWebsocketEventListener } from "@/presentation/shared/hooks/useWebsocketEventListener";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";

import Button from "@/presentation/theme/components/button";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Card from "@/presentation/theme/components/card";

export default function NoRestaurantScreen() {
  const { t } = useTranslation("auth");
  const { logout, checkStatus } = useAuthStore();

  useWebsocketEventListener(OrderSocketEvent.restaurantAssigned, async () => {
    toast.success(t("noRestaurant.assignedSuccess"));
    await checkStatus();
    router.replace("/(app)/(tabs)/(orders-module)/my-orders");
  });

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    <ScreenLayout style={tw`flex-1 px-6`}>
      <ThemedView style={tw`flex-1 justify-center gap-8`}>
        <ThemedView style={tw`items-center gap-2`}>
          <Ionicons
            name="restaurant-outline"
            size={64}
            color={tw.color("light-primary")}
          />
          <ThemedText type="h2" style={tw`text-center`}>
            {t("noRestaurant.title")}
          </ThemedText>
          <ThemedText type="body2" style={tw`text-center text-gray-600`}>
            {t("noRestaurant.subtitle")}
          </ThemedText>
        </ThemedView>

        <ThemedView style={tw`w-full gap-4`}>
          <Card variant="outline" style={tw`gap-3 `}>
            <ThemedView style={tw`flex-row items-center gap-3`}>
              <ThemedView
                style={tw`w-12 h-12 rounded-full bg-light-primary/10 items-center justify-center`}
              >
                <Ionicons
                  name="business-outline"
                  size={24}
                  color={tw.color("light-primary")}
                />
              </ThemedView>
              <ThemedView style={tw`flex-1 gap-1`}>
                <ThemedText type="h4">
                  {t("noRestaurant.createTitle")}
                </ThemedText>
                <ThemedText type="body2" style={tw`text-gray-600`}>
                  {t("noRestaurant.createDescription")}
                </ThemedText>
              </ThemedView>
            </ThemedView>
            <Button
              label={t("noRestaurant.createButton")}
              onPress={() => router.push("/create-restaurant")}
            />
          </Card>

          <Card variant="outline" style={tw`gap-3 `}>
            <ThemedView style={tw`flex-row items-center gap-3`}>
              <ThemedView
                style={tw`w-12 h-12 rounded-full bg-light-primary/10 items-center justify-center`}
              >
                <Ionicons
                  name="qr-code-outline"
                  size={24}
                  color={tw.color("light-primary")}
                />
              </ThemedView>
              <ThemedView style={tw`flex-1 gap-1`}>
                <ThemedText type="h4">{t("noRestaurant.joinTitle")}</ThemedText>
                <ThemedText type="body2" style={tw`text-gray-600`}>
                  {t("noRestaurant.joinDescription")}
                </ThemedText>
              </ThemedView>
            </ThemedView>
            <Button
              label={t("noRestaurant.joinButton")}
              onPress={() => router.push("/join-restaurant")}
              variant="secondary"
            />
          </Card>
        </ThemedView>
      </ThemedView>

      <ThemedView style={tw`mb-8 w-full`}>
        <Button
          variant="text"
          label={t("manage.logout")}
          onPress={handleLogout}
        />
      </ThemedView>
    </ScreenLayout>
  );
}
