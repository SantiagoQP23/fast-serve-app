import { PaymentMethodsService } from "@/core/restaurant/services/payment-methods.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { usePaymentMethodsStore } from "../store/usePaymentMethodsStore";

export const usePaymentMethods = () => {
  const { currentRestaurant } = useAuthStore();
  const {
    paymentMethods: cachedPaymentMethods,
    restaurantId: cachedRestaurantId,
    setPaymentMethods,
    clearPaymentMethods,
  } = usePaymentMethodsStore();

  const paymentMethodsQuery = useQuery({
    queryKey: ["payment-methods", currentRestaurant?.id],
    queryFn: () => PaymentMethodsService.getPaymentMethods(),
    enabled: false,
  });

  // Detect restaurant switch → clear stale cache → auto-refetch
  useEffect(() => {
    if (
      currentRestaurant?.id &&
      cachedRestaurantId &&
      currentRestaurant.id !== cachedRestaurantId
    ) {
      clearPaymentMethods();
      paymentMethodsQuery.refetch();
    }
  }, [currentRestaurant?.id, cachedRestaurantId, clearPaymentMethods, paymentMethodsQuery]);

  // Sync React Query result → Zustand store
  useEffect(() => {
    if (paymentMethodsQuery.data && currentRestaurant?.id) {
      setPaymentMethods(paymentMethodsQuery.data, currentRestaurant.id);
    }
  }, [paymentMethodsQuery.data, currentRestaurant?.id, setPaymentMethods]);

  const paymentMethods =
    cachedPaymentMethods.length > 0
      ? cachedPaymentMethods
      : paymentMethodsQuery.data ?? [];

  return {
    paymentMethods,
    paymentMethodsQuery,
  };
};
