import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner-native";
import { queryClient } from "@/app/_layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { ProductionAreasService } from "../services/production-areas.service";
import { useProductionAreasStore } from "../store/useProductionAreasStore";
import type { ProductionArea } from "@/core/menu/models/producion-area.model";
import type { CreateProductionAreaDto } from "../interfaces/dto/create-production-area.dto";
import type { UpdateProductionAreaDto } from "../interfaces/dto/update-production-area.dto";

const getProductionAreasQueryKey = (restaurantId?: string) => [
  "production-areas",
  restaurantId,
];

export const useProductionAreas = () => {
  const { t } = useTranslation("productionAreas");
  const { currentRestaurant } = useAuthStore();
  const restaurantId = currentRestaurant?.id;
  const {
    productionAreas: cachedProductionAreas,
    restaurantId: cachedRestaurantId,
    setProductionAreas,
    clearProductionAreas,
  } = useProductionAreasStore();

  const getAllQuery = useQuery({
    queryKey: getProductionAreasQueryKey(restaurantId),
    queryFn: () => ProductionAreasService.getAll(),
    enabled: !!restaurantId,
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

  const createProductionArea = useMutation<
    ProductionArea,
    Error,
    CreateProductionAreaDto
  >({
    mutationFn: (data: CreateProductionAreaDto) =>
      ProductionAreasService.create(data),
    onSuccess: () => {
      toast.success(t("createSuccess"));
      queryClient.invalidateQueries({
        queryKey: getProductionAreasQueryKey(restaurantId),
      });
    },
    onError: (error) => {
      console.log("Error creating production area", error);
      toast.error(error.message || t("createError"));
    },
  });

  const updateProductionArea = useMutation<
    ProductionArea,
    Error,
    UpdateProductionAreaDto
  >({
    mutationFn: (data: UpdateProductionAreaDto) =>
      ProductionAreasService.update(data),
    onSuccess: () => {
      // toast.success(t("updateSuccess"));
      queryClient.invalidateQueries({
        queryKey: getProductionAreasQueryKey(restaurantId),
      });
    },
    onError: (error) => {
      console.log("Error updating production area", error);
      toast.error(error.message || t("updateError"));
    },
  });

  const deleteProductionArea = useMutation<void, Error, number>({
    mutationFn: (id: number) => ProductionAreasService.delete(id),
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      queryClient.invalidateQueries({
        queryKey: getProductionAreasQueryKey(restaurantId),
      });
    },
    onError: (error) => {
      console.log("Error deleting production area", error);
      toast.error(error.message || t("deleteError"));
    },
  });

  // Return cached data as primary source (instant load)
  const productionAreas =
    cachedProductionAreas.length > 0
      ? cachedProductionAreas
      : (getAllQuery.data ?? []);

  return {
    getAllQuery,
    productionAreas,
    createProductionArea,
    updateProductionArea,
    deleteProductionArea,
  };
};
