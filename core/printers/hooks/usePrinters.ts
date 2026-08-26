import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { queryClient } from "@/app/_layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { PrintersService } from "../services/printers.service";
import type { Printer } from "@/core/common/models/printer.model";
import type { CreatePrinterDto } from "../interfaces/dto/create-printer.dto";
import type { UpdatePrinterDto } from "../interfaces/dto/update-printer.dto";

const getPrintersQueryKey = (restaurantId?: string) => [
  "printers",
  restaurantId,
];

export const usePrinters = () => {
  const { t } = useTranslation("printers");
  const { currentRestaurant } = useAuthStore();
  const restaurantId = currentRestaurant?.id;

  const getAllQuery = useQuery({
    queryKey: getPrintersQueryKey(restaurantId),
    queryFn: () => PrintersService.getAll(),
    enabled: !!restaurantId,
  });

  const createPrinter = useMutation<Printer, Error, CreatePrinterDto>({
    mutationFn: (data: CreatePrinterDto) => PrintersService.create(data),
    onSuccess: () => {
      toast.success(t("createSuccess"));
      queryClient.invalidateQueries({
        queryKey: getPrintersQueryKey(restaurantId),
      });
    },
    onError: (error) => {
      console.log("Error creating printer", error);
      toast.error(error.message || t("createError"));
    },
  });

  const updatePrinter = useMutation<Printer, Error, UpdatePrinterDto>({
    mutationFn: (data: UpdatePrinterDto) => PrintersService.update(data),
    onSuccess: () => {
      toast.success(t("updateSuccess"));
      queryClient.invalidateQueries({
        queryKey: getPrintersQueryKey(restaurantId),
      });
    },
    onError: (error) => {
      console.log("Error updating printer", error);
      toast.error(error.message || t("updateError"));
    },
  });

  const deletePrinter = useMutation<void, Error, string>({
    mutationFn: (id: string) => PrintersService.delete(id),
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      queryClient.invalidateQueries({
        queryKey: getPrintersQueryKey(restaurantId),
      });
    },
    onError: (error) => {
      console.log("Error deleting printer", error);
      toast.error(error.message || t("deleteError"));
    },
  });

  return {
    getAll: getAllQuery,
    createPrinter,
    updatePrinter,
    deletePrinter,
  };
};
