import type { Subscription } from "@/core/common/models/restaurant.model";
import type { LabelProps } from "@/presentation/theme/components/label";

type SubscriptionStatus = Subscription["status"];

/**
 * Status pill color by consequence: healthy → success, trial → info,
 * payment at risk → warning, new orders blocked → error.
 */
export const SUBSCRIPTION_STATUS_COLOR: Record<
  SubscriptionStatus,
  NonNullable<LabelProps["color"]>
> = {
  ACTIVE: "success",
  TRIAL: "info",
  GRACE_PERIOD: "warning",
  ON_HOLD: "error",
  PAUSED: "error",
  EXPIRED: "error",
  CANCELLED: "error",
};

/** Statuses that need the owner's attention; each has a reason key. */
const PROBLEM_STATUSES: SubscriptionStatus[] = [
  "GRACE_PERIOD",
  "ON_HOLD",
  "PAUSED",
  "EXPIRED",
  "CANCELLED",
];

export const hasSubscriptionProblem = (status: SubscriptionStatus) =>
  PROBLEM_STATUSES.includes(status);

/**
 * Which date line to show under the plan, as a `manage.subscription.*` key
 * plus the date it formats. Null when no date is meaningful (the problem
 * reason explains the state instead).
 */
export function getSubscriptionDateLine(
  subscription: Subscription,
): { key: string; date: string } | null {
  const { status, trialEndsAt, currentPeriodEnd, cancelledAt } = subscription;

  if (status === "TRIAL") {
    return trialEndsAt ? { key: "trialEnds", date: trialEndsAt } : null;
  }
  if (!currentPeriodEnd) return null;

  const endsInFuture = new Date(currentPeriodEnd).getTime() > Date.now();

  switch (status) {
    case "ACTIVE":
      return {
        key: cancelledAt ? "accessUntil" : "renewsOn",
        date: currentPeriodEnd,
      };
    case "EXPIRED":
    case "CANCELLED":
      return {
        key: endsInFuture ? "accessUntil" : "endedOn",
        date: currentPeriodEnd,
      };
    default:
      return null;
  }
}
