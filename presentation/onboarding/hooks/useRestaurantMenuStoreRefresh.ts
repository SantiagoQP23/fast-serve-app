import { useCallback } from "react";

import { queryClient } from "@/app/_layout";
import { RestaurantMenuService } from "@/core/menu/services/restaurant-menu.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";

/** Reloads the cached menu after the server changed it in bulk. */
export function useRestaurantMenuStoreRefresh() {
  const restaurantId = useAuthStore((state) => state.currentRestaurant?.id);

  return useCallback(async () => {
    if (!restaurantId) return;
    const menu = await RestaurantMenuService.getAllMenu(restaurantId);
    useMenuStore.getState().setMenu(menu, restaurantId);
    queryClient.invalidateQueries({ queryKey: ["menu"] });
  }, [restaurantId]);
}
