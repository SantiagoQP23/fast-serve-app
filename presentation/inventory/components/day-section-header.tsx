import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import dayjs from "dayjs";
import { formatDate, getRelativeDate } from "@/core/i18n/utils";

/** "Hoy", "Ayer" or "Lunes, 13/10/2026", above a day's group of cards. */
export default function DaySectionHeader({ day }: { day: string }) {
  const relative = getRelativeDate(day);
  const date = dayjs(day);
  // getRelativeDate falls back to the plain date when it isn't today/yesterday.
  const label =
    relative === formatDate(date)
      ? `${date.format("dddd")}, ${relative}`
      : relative;

  return (
    <ThemedText
      type="caption"
      style={tw`text-gray-500 font-semibold pt-2`}
      accessibilityRole="header"
    >
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </ThemedText>
  );
}
