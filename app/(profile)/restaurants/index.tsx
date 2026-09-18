import { ActivityIndicator, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { translateRole } from "@/core/i18n/utils";
import { switchRestaurantMutation } from "@/presentation/profile/hooks/useSwitchRestaurant";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import { GroupedList } from "@/presentation/theme/components/grouped-list";

export default function RestaurantsScreen() {
  const { t } = useTranslation("auth");
  const switchRestaurant = switchRestaurantMutation();
  const { user, currentRestaurant, bootstrapStatus } = useAuthStore();
  const isSwitching =
    switchRestaurant.isPending || bootstrapStatus === "loading";
  const onSwitchRestaurant = (restaurantId: string) => {
    switchRestaurant.mutate(restaurantId);
  };

  const sortedRestaurantRoles = [...(user?.restaurantRoles ?? [])].sort(
    (a, b) => {
      if (a.restaurant.id === currentRestaurant?.id) return -1;
      if (b.restaurant.id === currentRestaurant?.id) return 1;
      return 0;
    },
  );

  return (
    <ScreenLayout style={tw`px-4  flex-1 gap-4`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
      >
        <ThemedView style={tw`mt-4`}>
          <GroupedList
            data={sortedRestaurantRoles}
            keyExtractor={(restaurantRole) => restaurantRole.restaurant.id}
            onItemPress={(restaurantRole) =>
              onSwitchRestaurant(restaurantRole.restaurant.id)
            }
            renderItem={(restaurantRole) => {
              const isSelected =
                restaurantRole.restaurant.id === currentRestaurant?.id;

              return (
                <ThemedView style={tw`flex-row items-center gap-3`}>
                  <ThemedView style={tw`flex-1 gap-1`}>
                    <ThemedText type={isSelected ? "h4" : "body1"}>
                      {restaurantRole.restaurant.name}
                    </ThemedText>
                    <ThemedView style={tw`flex-row items-center gap-1`}>
                      <ThemedText type={isSelected ? "body1" : "body2"}>
                        {translateRole(restaurantRole.role.name)}
                      </ThemedText>
                      {restaurantRole.restaurant.address && (
                        <ThemedText type={isSelected ? "body1" : "body2"}>
                          {restaurantRole.restaurant.address}
                        </ThemedText>
                      )}
                    </ThemedView>
                  </ThemedView>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={tw.color("light-primary")}
                    />
                  )}
                </ThemedView>
              );
            }}
          />
        </ThemedView>

        <Card variant="outline" style={tw`gap-3`}>
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
      </ScrollView>

      {isSwitching && (
        <ThemedView
          style={tw`absolute inset-0 bg-black/20 justify-center items-center`}
        >
          <ActivityIndicator />
        </ThemedView>
      )}
    </ScreenLayout>
  );
}
