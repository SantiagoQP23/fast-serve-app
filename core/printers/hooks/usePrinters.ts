import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { usePrintersStore } from "@/presentation/printers/store/usePrintersStore";
import { PrintersService } from "../services/printers.service";
import type { Printer } from "@/core/common/models/printer.model";
import type { CreatePrinterDto } from "../interfaces/dto/create-printer.dto";
import type { UpdatePrinterDto } from "../interfaces/dto/update-printer.dto";
import { useEffect } from "react";
import { getErrorMessage } from "@/core/api/get-error-message";

const getPrintersQueryKey = (restaurantId?: string) => [
  "printers",
  restaurantId,
];

export const usePrinters = () => {
  const { t } = useTranslation("printers");
  const { currentRestaurant } = useAuthStore();
  const restaurantId = currentRestaurant?.id;
  const {
    printers: cachedPrinters,
    restaurantId: cachedRestaurantId,
    setPrinters,
    clearPrinters,
  } = usePrintersStore();

  const getAllQuery = useQuery({
    queryKey: getPrintersQueryKey(restaurantId),
    queryFn: () => PrintersService.getAll(),
    enabled: false,
  });

  // Detect restaurant switch → clear stale cache → auto-refetch
  useEffect(() => {
    if (
      currentRestaurant?.id &&
      cachedRestaurantId &&
      currentRestaurant.id !== cachedRestaurantId
    ) {
      clearPrinters();
      getAllQuery.refetch();
    }
  }, [currentRestaurant?.id, cachedRestaurantId, clearPrinters, getAllQuery]);

  // Sync React Query result → Zustand store
  useEffect(() => {
    if (getAllQuery.data && currentRestaurant?.id) {
      setPrinters(getAllQuery.data, currentRestaurant.id);
    }
  }, [getAllQuery.data, currentRestaurant?.id, setPrinters]);

  const printers =
    cachedPrinters.length > 0 ? cachedPrinters : (getAllQuery.data ?? []);

  const createPrinter = useMutation<Printer, Error, CreatePrinterDto>({
    mutationFn: (data: CreatePrinterDto) => PrintersService.create(data),
    onSuccess: () => {
      getAllQuery.refetch();
    },
    onError: (error) => {
      console.log("Error creating printer", error);
      toast.error(getErrorMessage(error, { fallback: t("createError") }));
    },
  });

  const updatePrinter = useMutation<Printer, Error, UpdatePrinterDto>({
    mutationFn: (data: UpdatePrinterDto) => PrintersService.update(data),
    onSuccess: () => {
      getAllQuery.refetch();
    },
    onError: (error) => {
      console.log("Error updating printer", error);
      toast.error(getErrorMessage(error, { fallback: t("updateError") }));
    },
  });

  const deletePrinter = useMutation<void, Error, string>({
    mutationFn: (id: string) => PrintersService.delete(id),
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      getAllQuery.refetch();
    },
    onError: (error) => {
      console.log("Error deleting printer", error);
      toast.error(getErrorMessage(error, { fallback: t("deleteError") }));
    },
  });

  return {
    getAll: { ...getAllQuery, data: printers },
    createPrinter,
    updatePrinter,
    deletePrinter,
  };
};
