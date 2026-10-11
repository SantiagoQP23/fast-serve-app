import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { getRelativeDate } from "@/core/i18n/utils";

/** "Hoy", "Ayer" or the date, above a day's group of cards. */
export default function DaySectionHeader({ day }: { day: string }) {
  return (
    <ThemedText type="body1" style={tw`font-semibold pt-2`}>
      {getRelativeDate(day)}
    </ThemedText>
  );
}

/** The hour ("14:00") above that hour's cards within a day. */
export function HourSectionHeader({ hour }: { hour: string }) {
  return (
    <ThemedText type="small" style={tw`text-gray-500 font-semibold`}>
      {hour}
    </ThemedText>
  );
}
