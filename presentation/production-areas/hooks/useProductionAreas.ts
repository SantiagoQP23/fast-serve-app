import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ProductionAreasService } from "../services/production-areas.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useProductionAreasStore } from "../store/useProductionAreasStore";

export const useProductionAreas = () => {
  const { currentRestaurant } = useAuthStore();
  const {
    productionAreas: cachedProductionAreas,
    restaurantId: cachedRestaurantId,
    setProductionAreas,
    clearProductionAreas,
  } = useProductionAreasStore();

  const getAllQuery = useQuery({
    queryKey: ["production-areas", currentRestaurant?.id],
    queryFn: () => ProductionAreasService.getAll(),
  });

  // Clear areas if restaurant changed
  useEffect(() => {
    if (
      currentRestaurant?.id &&
      cachedRestaurantId &&
      currentRestaurant.id !== cachedRestaurantId
    ) {
      clearProductionAreas();
    }
  }, [currentRestaurant?.id, cachedRestaurantId, clearProductionAreas]);

  // Save to store when query succeeds
  useEffect(() => {
    if (getAllQuery.data && currentRestaurant?.id) {
      setProductionAreas(getAllQuery.data, currentRestaurant.id);
    }
  }, [getAllQuery.data, currentRestaurant?.id, setProductionAreas]);

  // Return cached data as primary source (instant load)
  const productionAreas =
    cachedProductionAreas.length > 0
      ? cachedProductionAreas
      : getAllQuery.data ?? [];

  return {
    getAllQuery,
    productionAreas,
  };
};
