import { useQuery } from "@tanstack/react-query";
import { SubscriptionsService } from "@/core/subscriptions/services/subscriptions.service";

export const usePlans = () => {
  return useQuery({
    queryKey: ["plans"],
    queryFn: SubscriptionsService.getPlans,
  });
};
