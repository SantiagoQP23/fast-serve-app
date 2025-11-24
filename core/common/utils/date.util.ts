import dayjs from "dayjs";

export const getFormattedDate = (date: string | Date) => {
  const formattedDate = dayjs(date).isSame(dayjs(), "day")
    ? `Today, ${dayjs(date).format("HH:mm")}`
    : dayjs(date).format("dddd, HH:mm");

  return formattedDate;
};
