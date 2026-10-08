import { isAxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { PurchaseSubscriptionService } from "@/core/subscriptions/services/purchase-subscription.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import type { VerifyPurchaseResponse } from "@/core/subscriptions/dto/verify-purchase.dto";
import { getErrorMessage } from "@/core/api/get-error-message";

export const usePurchaseSubscription = () => {
  const { t } = useTranslation("auth");
  const checkStatus = useAuthStore((state) => state.checkStatus);

  return useMutation<VerifyPurchaseResponse, Error, void>({
    mutationFn: () => PurchaseSubscriptionService.purchase(),
    onSuccess: async () => {
      // Refreshes currentRestaurant.subscription app-wide (GET /auth/auth-renew).
      await checkStatus();
      toast.success(t("manage.subscription.purchaseSuccess"));
    },
    onError: (error) => {
      // Google Play billing errors are not API errors: keep their own message.
      toast.error(
        isAxiosError(error)
          ? getErrorMessage(error, {
              fallback: t("manage.subscription.purchaseError"),
            })
          : error.message || t("manage.subscription.purchaseError"),
      );
    },
  });
};
