import Label, { type LabelProps } from "@/presentation/theme/components/label";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import type { Subscription } from "@/core/common/models/restaurant.model";
import { SUBSCRIPTION_STATUS_COLOR } from "@/presentation/subscriptions/utils/subscription-status";

interface SubscriptionStatusLabelProps {
  status: Subscription["status"];
  size?: LabelProps["size"];
}

/** Status pill colored by what the status means for the restaurant. */
export default function SubscriptionStatusLabel({
  status,
  size = "small",
}: SubscriptionStatusLabelProps) {
  const { t } = useTranslation("auth");

  return (
    <Label
      text={t(`manage.subscription.${status.toLowerCase()}`)}
      color={SUBSCRIPTION_STATUS_COLOR[status] ?? "default"}
      size={size}
    />
  );
}
