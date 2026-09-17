import { useEffect, useState, useCallback } from "react";
import { router } from "expo-router";
import { toast } from "sonner-native";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";

import tw from "@/presentation/theme/lib/tailwind";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { RestaurantService } from "@/core/restaurant/services/restaurant.service";
import { useWebsocketEventListener } from "@/presentation/shared/hooks/useWebsocketEventListener";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";

import Button from "@/presentation/theme/components/button";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Card from "@/presentation/theme/components/card";

const EXPIRY_SECONDS = 5 * 60; // 5 minutes

export default function JoinRestaurantScreen() {
  const { t } = useTranslation("auth");
  const { checkStatus } = useAuthStore();
  const [token, setToken] = useState<string>("");
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS);
  const [isLoading, setIsLoading] = useState(false);

  useWebsocketEventListener(OrderSocketEvent.restaurantAssigned, async () => {
    toast.success(t("noRestaurant.assignedSuccess"));
    await checkStatus();
    router.replace("/(app)/(tabs)/(orders-module)/my-orders");
  });

  const generateToken = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await RestaurantService.generateQrToken();
      setToken(response.token);
      setSecondsLeft(EXPIRY_SECONDS);
    } catch {
      toast.error(t("joinRestaurant.errorMessage"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    generateToken();
  }, [generateToken]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          generateToken();
          return EXPIRY_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [token, generateToken]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const qrPayload = token
    ? `${process.env.EXPO_PUBLIC_APP_URL}/invite?token=${token}`
    : "";

  return (
    <ScreenLayout style={tw`flex-1 px-6`}>
      <ThemedView style={tw`flex-1 justify-center items-center gap-6`}>
        <ThemedView style={tw`items-center gap-2`}>
          <Ionicons
            name="qr-code-outline"
            size={64}
            color={tw.color("light-primary")}
          />
          <ThemedText type="h2" style={tw`text-center`}>
            {t("joinRestaurant.title")}
          </ThemedText>
          <ThemedText type="body2" style={tw`text-center text-gray-600`}>
            {t("joinRestaurant.description")}
          </ThemedText>
        </ThemedView>

        <Card style={tw`gap-4 items-center justify-center`}>
          {qrPayload ? (
            <QRCode value={qrPayload} size={220} />
          ) : (
            <ThemedView
              style={tw`w-[220px] h-[220px] items-center justify-center`}
            >
              <Ionicons
                name="refresh-outline"
                size={48}
                color={tw.color("gray-400")}
              />
            </ThemedView>
          )}

          <ThemedView style={tw`flex-row items-center gap-2`}>
            <Ionicons
              name="time-outline"
              size={16}
              color={
                secondsLeft < 30 ? tw.color("red-500") : tw.color("gray-500")
              }
            />
            <ThemedText
              type="body2"
              style={tw.style(
                secondsLeft < 30 ? "text-red-500" : "text-gray-500",
              )}
            >
              {t("joinRestaurant.expiresIn", { time: formatTime(secondsLeft) })}
            </ThemedText>
          </ThemedView>
        </Card>

        <ThemedView style={tw`w-full gap-3`}>
          <Button
            label={t("joinRestaurant.regenerateButton")}
            onPress={generateToken}
            loading={isLoading}
            disabled={isLoading}
            variant="secondary"
          />
          <Button
            label={t("joinRestaurant.backButton")}
            onPress={() => router.back()}
            variant="text"
          />
        </ThemedView>
      </ThemedView>
    </ScreenLayout>
  );
}
