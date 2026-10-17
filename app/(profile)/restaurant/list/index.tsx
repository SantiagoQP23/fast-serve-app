import { ActivityIndicator, ScrollView } from "react-native";
import { router } from "expo-router";
import Ionicons from "@react-native-vector-icons/ionicons/static";

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
import { ROUTES } from "@/constants/routes";
import { Roles } from "@/core/auth/models/user.model";

type RestaurantRole = NonNullable<
  ReturnType<typeof useAuthStore.getState>["user"]
>["restaurantRoles"][number];

export default function RestaurantsScreen() {
  const { t } = useTranslation("auth");
  const switchRestaurant = switchRestaurantMutation();
  const { user, currentRestaurant, bootstrapStatus } = useAuthStore();
  const isSwitching =
    switchRestaurant.isPending || bootstrapStatus === "loading";
  const onSwitchRestaurant = (restaurantId: string) => {
    switchRestaurant.mutate(restaurantId, {
      onSuccess: () => {
        // Clear the profile stack so back doesn't return here, then go home
        if (router.canDismiss()) router.dismissAll();
        router.replace(ROUTES.APP.MY_ORDERS);
      },
    });
  };

  const isOwner = user?.role?.name === Roles.OWNER;
  const restaurantNames = new Map(
    (user?.restaurantRoles ?? []).map((rr) => [
      rr.restaurant.id,
      rr.restaurant.name,
    ]),
  );

  const currentRestaurantRole = (user?.restaurantRoles ?? []).find(
    (rr) => rr.restaurant.id === currentRestaurant?.id,
  );
  const otherRestaurantRoles = (user?.restaurantRoles ?? []).filter(
    (rr) => rr.restaurant.id !== currentRestaurant?.id,
  );

  const renderRestaurantRole = (restaurantRole: RestaurantRole) => {
    const isSelected = restaurantRole.restaurant.id === currentRestaurant?.id;
    const parentId = restaurantRole.restaurant.parentRestaurantId;
    const parentName = parentId ? restaurantNames.get(parentId) : undefined;

    return (
      <ThemedView style={[tw`flex-row items-center gap-3`]}>
        <ThemedView style={tw`flex-1 gap-1`}>
          <ThemedText type={isSelected ? "h4" : "body1"}>
            {restaurantRole.restaurant.name}
          </ThemedText>
          {parentName && (
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("createBranch.branchOf", { name: parentName })}
            </ThemedText>
          )}
          <ThemedView style={tw`flex-row items-center gap-1`}>
            <ThemedText type={isSelected ? "body1" : "body2"}>
              {translateRole(restaurantRole.role.name)}
            </ThemedText>
            {restaurantRole.restaurant.address && (
              <>
                <ThemedText type={isSelected ? "body2" : "small"}>•</ThemedText>
                <ThemedText type={isSelected ? "body1" : "body2"}>
                  {restaurantRole.restaurant.address}
                </ThemedText>
              </>
            )}
          </ThemedView>
        </ThemedView>
        {isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={tw.color("primary")}
          />
        )}
      </ThemedView>
    );
  };

  return (
    <ScreenLayout style={tw`px-4  flex-1 gap-4`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-6 pb-8`}
      >
        {/* Current restaurant */}
        <ThemedView style={tw`mt-4 gap-2`}>
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("restaurantList.current")}
          </ThemedText>
          {currentRestaurantRole && (
            <GroupedList
              data={[currentRestaurantRole]}
              keyExtractor={(restaurantRole) => restaurantRole.restaurant.id}
              renderItem={renderRestaurantRole}
            />
          )}
          {isOwner && (
            <ThemedView style={tw`flew-row items-center justify-end`}>
              <Button
                label={t("createBranch.button")}
                onPress={() =>
                  router.push("/(profile)/restaurant/create-branch")
                }
                variant="text"
                leftIcon="git-branch-outline"
              />
            </ThemedView>
          )}
        </ThemedView>

        {/* Other restaurants */}
        {otherRestaurantRoles.length > 0 && (
          <ThemedView style={tw`gap-2`}>
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("restaurantList.others")}
            </ThemedText>
            <GroupedList
              data={otherRestaurantRoles}
              keyExtractor={(restaurantRole) => restaurantRole.restaurant.id}
              onItemPress={(restaurantRole) =>
                onSwitchRestaurant(restaurantRole.restaurant.id)
              }
              renderItem={renderRestaurantRole}
            />
          </ThemedView>
        )}

        <Card variant="outline" style={tw`gap-3`}>
          <ThemedView style={tw`flex-row items-center gap-3`}>
            <ThemedView
              style={tw`w-12 h-12 rounded-full bg-primary/10 items-center justify-center`}
            >
              <Ionicons
                name="qr-code-outline"
                size={24}
                color={tw.color("primary")}
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
