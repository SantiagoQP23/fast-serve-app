import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useRestaurantSettings } from "@/presentation/restaurant/hooks/useRestaurantSettings";
import { DEFAULT_ORDER_PREP_TIME } from "@/core/restaurant/models/restaurant-settings.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

export type ElapsedTimeColor = "success" | "warning" | "error";

const OVERDUE_WARNING_MINUTES = 15;
// Past a day overdue the order was forgotten, not late: stop the alarm.
const STALE_MINUTES = 24 * 60;
// The label counts whole minutes, so a quarter-minute tick is enough.
const TICK_MS = 15_000;

export const useOrderElapsedTime = (deliveryTime: Date | string) => {
  const { t } = useTranslation(["orders"]);
  const [now, setNow] = useState(() => dayjs());
  const { settings } = useRestaurantSettings();
  const visibleMinutesLeft = settings?.ORDER_PREP_TIME ?? DEFAULT_ORDER_PREP_TIME;

  useEffect(() => {
    const interval = setInterval(() => setNow(dayjs()), TICK_MS);
    return () => clearInterval(interval);
  }, []);

  // Positive while the order is still due, negative once it's overdue.
  const diffSeconds = dayjs(deliveryTime).diff(now, "second");
  const isOverdue = diffSeconds < 0;
  // Round up so "30s left" reads as 1 min, never 0.
  const totalMinutes = Math.max(1, Math.ceil(Math.abs(diffSeconds) / 60));

  const duration =
    totalMinutes < 60
      ? t("orders:elapsed.minutes", { count: totalMinutes })
      : totalMinutes < STALE_MINUTES
        ? totalMinutes % 60 === 0
          ? t("orders:elapsed.hours", { count: Math.floor(totalMinutes / 60) })
          : t("orders:elapsed.hoursMinutes", {
              hours: Math.floor(totalMinutes / 60),
              minutes: totalMinutes % 60,
            })
        : t("orders:elapsed.days", {
            count: Math.floor(totalMinutes / STALE_MINUTES),
          });

  const elapsedLabel = isOverdue ? `+${duration}` : duration;
  const isStale = isOverdue && totalMinutes >= STALE_MINUTES;

  const remainingMinutes = diffSeconds / 60;
  const overdueMinutes = -remainingMinutes;
  const elapsedColor: ElapsedTimeColor = !isOverdue
    ? "success"
    : overdueMinutes <= OVERDUE_WARNING_MINUTES
      ? "warning"
      : "error";

  const shouldShow = remainingMinutes <= visibleMinutesLeft;

  return { elapsedLabel, elapsedColor, isOverdue, isStale, shouldShow };
};
