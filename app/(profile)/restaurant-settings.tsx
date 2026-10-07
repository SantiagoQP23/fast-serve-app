import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
} from "react-native";
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
import TimeSelector from "@/presentation/theme/components/time-selector";
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
  const [draftPrepTime, setDraftPrepTime] = useState<number | null>(null);
  const prepTime = draftPrepTime ?? savedPrepTime;

  const handleDonePrepTime = async (value: number) => {
    await updateSettings.mutateAsync({ ORDER_PREP_TIME: value });
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
              <Card
                style={tw`gap-3 p-4 rounded-3xl flex-row items-center justify-between`}
              >
                <ThemedText type="body1">
                  {t("restaurantSettings.orderPrepTime.title")}
                </ThemedText>
                <TimeSelector
                  pickerTitle={t(
                    "restaurantSettings.orderPrepTime.pickerTitle",
                  )}
                  pickerDescription={t(
                    "restaurantSettings.orderPrepTime.description",
                  )}
                  doneLabel={t("restaurantSettings.orderPrepTime.done")}
                  hoursUnit={t("restaurantSettings.orderPrepTime.hoursUnit")}
                  minutesUnit={t(
                    "restaurantSettings.orderPrepTime.minutesUnit",
                  )}
                  value={prepTime}
                  onChange={setDraftPrepTime}
                  onDone={handleDonePrepTime}
                  maxMinutes={MAX_ORDER_PREP_TIME}
                  editable={canEdit}
                />
              </Card>
            </ThemedView>
          )}
        </ScrollView>
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
