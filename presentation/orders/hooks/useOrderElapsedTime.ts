import { useEffect, useState } from "react";
import dayjs from "dayjs";

export type ElapsedTimeColor = "success" | "warning" | "error";

export const useOrderElapsedTime = (createdAt: Date | string) => {
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    const interval = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedSeconds = Math.max(0, now.diff(dayjs(createdAt), "second"));
  const elapsedHours = Math.floor(elapsedSeconds / 3600);
  const elapsedMinutes = Math.floor((elapsedSeconds % 3600) / 60);
  const elapsedSecondsPart = elapsedSeconds % 60;

  const elapsedLabel = `${String(elapsedHours).padStart(2, "0")}:${String(
    elapsedMinutes,
  ).padStart(2, "0")}:${String(elapsedSecondsPart).padStart(2, "0")}`;

  const elapsedTotalMinutes = elapsedSeconds / 60;
  const elapsedColor: ElapsedTimeColor =
    elapsedTotalMinutes < 15
      ? "success"
      : elapsedTotalMinutes < 30
        ? "warning"
        : "error";

  return { elapsedLabel, elapsedColor };
};
