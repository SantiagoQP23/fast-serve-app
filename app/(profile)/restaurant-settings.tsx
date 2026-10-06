import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { useRestaurantSettings } from "@/presentation/restaurant/hooks/useRestaurantSettings";
import { DEFAULT_ORDER_PREP_TIME } from "@/core/restaurant/models/restaurant-settings.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import TextInput from "@/presentation/theme/components/text-input";
import tw from "@/presentation/theme/lib/tailwind";

const MAX_ORDER_PREP_TIME = 600;

export default function RestaurantSettingsScreen() {
  const { t } = useTranslation("auth");
  const { user } = useAuthStore();
  const canEdit = isAdminLevelRole(user?.role?.name);
  const { getAllQuery, settings, updateSettings } = useRestaurantSettings();
  const { isLoading, isError, refetch, isRefetching } = getAllQuery;

  const savedPrepTime = settings?.ORDER_PREP_TIME ?? DEFAULT_ORDER_PREP_TIME;
  // null until the user edits the field, so it follows the loaded value
  const [draftPrepTime, setDraftPrepTime] = useState<string | null>(null);
  const prepTime = draftPrepTime ?? String(savedPrepTime);
  const [error, setError] = useState<string>();

  const parsedPrepTime = Number(prepTime);
  const hasChanges = prepTime.trim() !== "" && parsedPrepTime !== savedPrepTime;

  const handleChangePrepTime = (value: string) => {
    setDraftPrepTime(value.replace(/[^0-9]/g, ""));
    setError(undefined);
  };

  const handleSave = async () => {
    if (
      !Number.isInteger(parsedPrepTime) ||
      parsedPrepTime < 1 ||
      parsedPrepTime > MAX_ORDER_PREP_TIME
    ) {
      setError(
        t("restaurantSettings.orderPrepTime.invalid", {
          max: MAX_ORDER_PREP_TIME,
        }),
      );
      return;
    }

    await updateSettings.mutateAsync({ ORDER_PREP_TIME: parsedPrepTime });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScreenLayout style={tw`px-4 pt-4 flex-1 gap-4`}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-8`}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          {isLoading && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <Ionicons name="settings-outline" size={48} color="#999" />
              <ThemedText type="body1" style={tw`text-gray-500`}>
                {t("restaurantSettings.loading")}
              </ThemedText>
            </ThemedView>
          )}

          {isError && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <ThemedText type="body1" style={tw`text-red-500`}>
                {t("restaurantSettings.loadError")}
              </ThemedText>
              <Button
                label={t("restaurantSettings.retry")}
                onPress={() => refetch()}
                variant="outline"
              />
            </ThemedView>
          )}

          {!isLoading && !isError && (
            <ThemedView style={tw`gap-4`}>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("restaurantSettings.ordersGroup")}
              </ThemedText>
              <Card style={tw`gap-3 p-4 rounded-3xl`}>
                <ThemedView style={tw`gap-1`}>
                  <ThemedText type="body1">
                    {t("restaurantSettings.orderPrepTime.title")}
                  </ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("restaurantSettings.orderPrepTime.description")}
                  </ThemedText>
                </ThemedView>
                <TextInput
                  label={t("restaurantSettings.orderPrepTime.label")}
                  icon="time-outline"
                  value={prepTime}
                  onChangeText={handleChangePrepTime}
                  keyboardType="number-pad"
                  maxLength={3}
                  editable={canEdit}
                  error={error}
                />
              </Card>

              {canEdit && (
                <Button
                  label={t("restaurantSettings.save")}
                  onPress={handleSave}
                  loading={updateSettings.isPending}
                  disabled={!hasChanges || updateSettings.isPending}
                />
              )}
            </ThemedView>
          )}
        </ScrollView>
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
