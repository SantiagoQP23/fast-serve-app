import { Pressable } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { switchRestaurantMutation } from "@/presentation/profile/hooks/useSwitchRestaurant";

export default function RestaurantsScreen() {
  const switchRestaurant = switchRestaurantMutation();
  const { user, currentRestaurant } = useAuthStore();
  const onSwitchRestaurant = (restaurantId: string) => {
    switchRestaurant.mutate(restaurantId);
  };
  return (
    <ThemedView style={tw`px-4  flex-1 gap-4`}>
      <ThemedView style={tw`mt-4`}>
        <ThemedView style={tw`rounded-lg  p-4 gap-4`}>
          {user?.restaurantRoles.map((restaurantRole) => (
            <Pressable
              style={({ pressed }) =>
                tw.style(
                  ` gap-2 p-4 border border-gray-300 rounded-lg`,
                  pressed && "opacity-70",
                  restaurantRole.restaurant.id === currentRestaurant?.id &&
                    "bg-gray-100 border-black",
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
              <ThemedText type="body2">
                {restaurantRole.restaurant.address}
              </ThemedText>
            </Pressable>
          ))}
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
