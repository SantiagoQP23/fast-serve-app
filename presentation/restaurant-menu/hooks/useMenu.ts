import { RestaurantMenuService } from "@/core/menu/services/restaurant-menu.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useMenuStore } from "../store/useMenuStore";

export const useMenu = () => {
  const { currentRestaurant } = useAuthStore();
  const { 
    sections: cachedSections, 
    categories: cachedCategories, 
    products: cachedProducts,
    restaurantId: cachedRestaurantId,
    setMenu,
    clearMenu
  } = useMenuStore();
  
  const menuQuery = useQuery({
    queryKey: ["menu", currentRestaurant?.id],
    queryFn: async () => {
      if (!currentRestaurant) {
        throw new Error("No restaurant selected");
      }
      return RestaurantMenuService.getAllMenu(currentRestaurant?.id);
    },
    enabled: false, // Disable automatic fetching - only fetch on manual refetch
  });

  // Clear menu if restaurant changed and auto-fetch new restaurant's menu
  useEffect(() => {
    if (currentRestaurant?.id && cachedRestaurantId && currentRestaurant.id !== cachedRestaurantId) {
      clearMenu();
      menuQuery.refetch(); // Auto-fetch when restaurant changes
    }
  }, [currentRestaurant?.id, cachedRestaurantId, clearMenu, menuQuery]);

  // Save to store when query succeeds
  useEffect(() => {
    if (menuQuery.data && currentRestaurant?.id) {
      setMenu(menuQuery.data, currentRestaurant.id);
    }
  }, [menuQuery.data, currentRestaurant?.id, setMenu]);

  // Return cached data as primary source (instant load)
  // Falls back to query data if cache is empty
  const sections = cachedSections.length > 0 ? cachedSections : (menuQuery.data?.sections || []);
  const categories = cachedCategories.length > 0 ? cachedCategories : (menuQuery.data?.categories || []);
  const products = cachedProducts.length > 0 ? cachedProducts : (menuQuery.data?.products || []);

  return {
    sections,
    categories,
    products,
    menuQuery,
  };
};
