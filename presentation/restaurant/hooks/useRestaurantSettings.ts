import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { queryClient } from "@/app/_layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { RestaurantSettingsService } from "@/core/restaurant/services/restaurant-settings.service";
import type {
  RestaurantSettings,
  RestaurantSettingValue,
} from "@/core/restaurant/models/restaurant-settings.model";
import { getErrorMessage } from "@/core/api/get-error-message";

const getRestaurantSettingsQueryKey = (restaurantId?: string) => [
  "restaurant-settings",
  restaurantId,
];

export const useRestaurantSettings = () => {
  const { t } = useTranslation("auth");
  const { currentRestaurant } = useAuthStore();
  const restaurantId = currentRestaurant?.id;

  const getAllQuery = useQuery({
    queryKey: getRestaurantSettingsQueryKey(restaurantId),
    queryFn: () => RestaurantSettingsService.getAll(),
    enabled: !!restaurantId,
  });

  const updateSettings = useMutation<
    RestaurantSettings,
    Error,
    Record<string, RestaurantSettingValue>
  >({
    mutationFn: (settings) => RestaurantSettingsService.update(settings),
    onSuccess: (settings) => {
      queryClient.setQueryData(
        getRestaurantSettingsQueryKey(restaurantId),
        settings,
      );
    },
    onError: (error) => {
      console.log("Error updating restaurant settings", error);
      toast.error(
        getErrorMessage(error, {
          fallback: t("restaurantSettings.updateError"),
        }),
      );
    },
  });

  return {
    getAllQuery,
    settings: getAllQuery.data,
    updateSettings,
  };
};
