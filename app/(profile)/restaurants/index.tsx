import { ActivityIndicator, Pressable } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { switchRestaurantMutation } from "@/presentation/profile/hooks/useSwitchRestaurant";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Card from "@/presentation/theme/components/card";

export default function RestaurantsScreen() {
  const switchRestaurant = switchRestaurantMutation();
  const { user, currentRestaurant, bootstrapStatus } = useAuthStore();
  const isSwitching =
    switchRestaurant.isPending || bootstrapStatus === "loading";
  const onSwitchRestaurant = (restaurantId: string) => {
    switchRestaurant.mutate(restaurantId);
  };
  return (
    <ScreenLayout style={tw`px-4  flex-1 gap-4`}>
      <ThemedView style={tw`mt-4`}>
        <ThemedView style={tw`rounded-lg  p-4 gap-4`}>
          {user?.restaurantRoles.map((restaurantRole) => (
            <Card
              style={({ pressed }) =>
                tw.style(
                  ` gap-2 p-4  `,
                  restaurantRole.restaurant.id === currentRestaurant?.id &&
                    "border border-light-border ",
                )
              }
              onPress={() => {
                onSwitchRestaurant(restaurantRole.restaurant.id);
              }}
              key={restaurantRole.restaurant.id}
            >
              <ThemedText type="h4">
                {restaurantRole.restaurant.name}
              </ThemedText>
              {restaurantRole.restaurant.address && (
                <ThemedText type="body2">
                  {restaurantRole.restaurant.address}
                </ThemedText>
              )}
            </Card>
          ))}
        </ThemedView>
      </ThemedView>

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
