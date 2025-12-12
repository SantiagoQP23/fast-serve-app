import { RestaurantMenuService } from "@/core/menu/services/restaurant-menu.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export const useMenu = () => {
  const { currentRestaurant } = useAuthStore();
  const menuQuery = useQuery({
    queryKey: ["menu", currentRestaurant?.id],
    queryFn: async () => {
      if (!currentRestaurant) {
        throw new Error("No restaurant selected");
      }
      return RestaurantMenuService.getAllMenu(currentRestaurant?.id);
    },
  });

  const menu = menuQuery.data;
  const sections = menu?.sections || [];
  const categories = menu?.categories || [];
  const products = menu?.products || [];

  return {
    sections,
    categories,
    products,
    menuQuery,
  };
};
