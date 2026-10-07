import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useRestaurantSettings } from "@/presentation/restaurant/hooks/useRestaurantSettings";
import { DEFAULT_ORDER_PREP_TIME } from "@/core/restaurant/models/restaurant-settings.model";

export type ElapsedTimeColor = "success" | "warning" | "error";

const OVERDUE_WARNING_MINUTES = 15;

export const useOrderElapsedTime = (deliveryTime: Date | string) => {
  const [now, setNow] = useState(() => dayjs());
  const { settings } = useRestaurantSettings();
  const visibleMinutesLeft = settings?.ORDER_PREP_TIME ?? DEFAULT_ORDER_PREP_TIME;

  useEffect(() => {
    const interval = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Positive while the order is still due, negative once it's overdue.
  const diffSeconds = dayjs(deliveryTime).diff(now, "second");
  const isOverdue = diffSeconds < 0;
  const totalSeconds = Math.abs(diffSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const elapsedLabel = `${isOverdue ? "+" : ""}${String(minutes).padStart(
    2,
    "0",
  )}:${String(seconds).padStart(2, "0")}`;

  const remainingMinutes = diffSeconds / 60;
  const overdueMinutes = -remainingMinutes;
  const elapsedColor: ElapsedTimeColor = !isOverdue
    ? "success"
    : overdueMinutes <= OVERDUE_WARNING_MINUTES
      ? "warning"
      : "error";

  const shouldShow = remainingMinutes <= visibleMinutesLeft;

  return { elapsedLabel, elapsedColor, isOverdue, shouldShow };
};
