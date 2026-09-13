import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { PaymentMethodsService } from "@/core/restaurant/services/payment-methods.service";
import type { PaymentMethod } from "@/core/restaurant/models/payment-method.model";
import { usePaymentMethodsStore } from "../store/usePaymentMethodsStore";
import type { CreatePaymentMethodDto } from "../interfaces/dto/create-payment-method.dto";
import type { UpdatePaymentMethodDto } from "../interfaces/dto/update-payment-method.dto";

export const usePaymentMethodsManagement = () => {
  const { t } = useTranslation("paymentMethods");
  const { upsertPaymentMethod, removePaymentMethod } =
    usePaymentMethodsStore();

  const createPaymentMethod = useMutation<
    PaymentMethod,
    Error,
    CreatePaymentMethodDto
  >({
    mutationFn: (data) => PaymentMethodsService.create(data),
    onSuccess: (paymentMethod) => {
      upsertPaymentMethod(paymentMethod);
      toast.success(t("methods.createSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("methods.createError"));
    },
  });

  const updatePaymentMethod = useMutation<
    PaymentMethod,
    Error,
    { id: number; data: UpdatePaymentMethodDto }
  >({
    mutationFn: ({ id, data }) => PaymentMethodsService.update(id, data),
    onSuccess: (paymentMethod) => {
      upsertPaymentMethod(paymentMethod);
      toast.success(t("methods.updateSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("methods.updateError"));
    },
  });

  const deletePaymentMethod = useMutation<void, Error, number>({
    mutationFn: (id) => PaymentMethodsService.remove(id),
    onSuccess: (_, id) => {
      removePaymentMethod(id);
      toast.success(t("methods.deleteSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("methods.deleteError"));
    },
  });

  return {
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  };
};
