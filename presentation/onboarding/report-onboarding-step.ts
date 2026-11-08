import { useEffect } from "react";
import { queryClient } from "@/app/_layout";
import { Roles } from "@/core/auth/models/user.model";
import type { Restaurant } from "@/core/common/models/restaurant.model";
import {
  OnboardingStep,
  type OnboardingStatus,
} from "@/core/restaurant/models/onboarding.model";
import { RestaurantService } from "@/core/restaurant/services/restaurant.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

export const ONBOARDING_QUERY_KEY = "onboarding";

/**
 * Whether this user should see the "Primeros pasos" checklist: the owner of a
 * restaurant whose checklist isn't done. `undefined` (old backend) hides it.
 */
export function isOnboardingPending(
  restaurant: Restaurant | undefined,
  role: Roles | undefined,
): boolean {
  return role === Roles.OWNER && restaurant?.onboardingCompleted === false;
}

/** Keeps the session's restaurant and the checklist query in step. */
export function applyOnboardingStatus(status: OnboardingStatus) {
  const { currentRestaurant, updateCurrentRestaurantInfo } =
    useAuthStore.getState();
  if (!currentRestaurant) return;
  updateCurrentRestaurantInfo({
    onboardingCompleted: status.completed,
    onboardingSteps: status.steps,
  });
  queryClient.setQueryData(
    [ONBOARDING_QUERY_KEY, currentRestaurant.id],
    status,
  );
}

/**
 * Marks a checklist step as done after the owner does it somewhere in the
 * app. Fire-and-forget: does nothing for other roles, when the checklist is
 * already done, or when the step was reported before. A failed call (e.g.
 * offline) is dropped; the step is reported again next time.
 */
export function reportOnboardingStep(step: OnboardingStep): void {
  const { currentRestaurant, user } = useAuthStore.getState();
  if (!isOnboardingPending(currentRestaurant, user?.role?.name)) return;
  if (currentRestaurant?.onboardingSteps?.includes(step)) return;

  RestaurantService.updateOnboarding({ completeStep: step })
    .then(applyOnboardingStatus)
    .catch(() => {});
}

/**
 * A RESTAURANT sync event: another phone changed the checklist (or anything
 * else on the restaurant). Only the onboarding fields are applied here.
 */
export function applyRestaurantSyncEvent(data: unknown): void {
  const restaurant = data as Partial<Restaurant> | null;
  const { currentRestaurant } = useAuthStore.getState();
  if (
    !restaurant ||
    !currentRestaurant ||
    restaurant.id !== currentRestaurant.id
  )
    return;
  if (restaurant.onboardingCompleted === undefined) return;

  useAuthStore.getState().updateCurrentRestaurantInfo({
    onboardingCompleted: restaurant.onboardingCompleted,
    onboardingSteps: restaurant.onboardingSteps ?? [],
  });
  queryClient.invalidateQueries({
    queryKey: [ONBOARDING_QUERY_KEY, currentRestaurant.id],
  });
}

/**
 * Reports `step` when the screen opens, or as soon as the session is ready
 * if the screen opened first (e.g. right after the app started).
 */
export function useReportOnboardingStepOnOpen(step: OnboardingStep): void {
  const restaurantId = useAuthStore((state) => state.currentRestaurant?.id);
  const role = useAuthStore((state) => state.user?.role?.name);

  useEffect(() => {
    if (restaurantId && role) reportOnboardingStep(step);
  }, [restaurantId, role, step]);
}
