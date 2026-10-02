import { useEffect, useState } from "react";
import dayjs from "dayjs";

export type ElapsedTimeColor = "success" | "warning" | "error";

const VISIBLE_MINUTES_LEFT = 15;
const OVERDUE_WARNING_MINUTES = 15;

export const useOrderElapsedTime = (deliveryTime: Date | string) => {
  const [now, setNow] = useState(() => dayjs());

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

  const shouldShow = remainingMinutes <= VISIBLE_MINUTES_LEFT;

  return { elapsedLabel, elapsedColor, isOverdue, shouldShow };
};
