import { useMutation, useQuery } from "@tanstack/react-query";

import type { OnboardingStatus } from "@/core/restaurant/models/onboarding.model";
import { RestaurantService } from "@/core/restaurant/services/restaurant.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import {
  ONBOARDING_STEPS,
  REQUIRED_ONBOARDING_STEPS,
} from "@/presentation/onboarding/onboarding-steps";
import {
  applyOnboardingStatus,
  isOnboardingPending,
  ONBOARDING_QUERY_KEY,
} from "@/presentation/onboarding/report-onboarding-step";

/** The owner's "Primeros pasos" checklist for the current restaurant. */
export function useOnboarding() {
  const currentRestaurant = useAuthStore((state) => state.currentRestaurant);
  const role = useAuthStore((state) => state.user?.role?.name);
  const pending = isOnboardingPending(currentRestaurant, role);

  const query = useQuery({
    queryKey: [ONBOARDING_QUERY_KEY, currentRestaurant?.id],
    queryFn: async () => {
      const status = await RestaurantService.getOnboarding();
      applyOnboardingStatus(status);
      return status;
    },
    enabled: pending,
    // Seed from the session so the card shows at once, offline included.
    placeholderData: (): OnboardingStatus | undefined =>
      currentRestaurant
        ? {
            completed: !!currentRestaurant.onboardingCompleted,
            steps: currentRestaurant.onboardingSteps ?? [],
            canClearSampleMenu: false,
          }
        : undefined,
  });

  const hide = useMutation({
    mutationFn: () => RestaurantService.updateOnboarding({ completed: true }),
    onSuccess: applyOnboardingStatus,
  });

  const done = new Set(query.data?.steps ?? []);
  const doneRequired = REQUIRED_ONBOARDING_STEPS.filter((step) =>
    done.has(step.key),
  ).length;

  return {
    visible: pending && !query.data?.completed,
    status: query.data,
    steps: ONBOARDING_STEPS.map((step) => ({
      ...step,
      done: done.has(step.key),
    })),
    doneRequired,
    totalRequired: REQUIRED_ONBOARDING_STEPS.length,
    allRequiredDone: doneRequired === REQUIRED_ONBOARDING_STEPS.length,
    refetch: query.refetch,
    hide,
  };
}
