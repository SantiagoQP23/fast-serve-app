import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { PurchaseSubscriptionService } from "@/core/subscriptions/services/purchase-subscription.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import type { VerifyPurchaseResponse } from "@/core/subscriptions/dto/verify-purchase.dto";

export const useRestorePurchases = () => {
  const { t } = useTranslation("auth");
  const checkStatus = useAuthStore((state) => state.checkStatus);

  return useMutation<VerifyPurchaseResponse | null, Error, void>({
    mutationFn: () => PurchaseSubscriptionService.restore(),
    onSuccess: async (result) => {
      if (!result) {
        toast.error(t("manage.subscription.restoreNotFound"));
        return;
      }
      await checkStatus();
      toast.success(t("manage.subscription.restoreSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("manage.subscription.restoreError"));
    },
  });
};
